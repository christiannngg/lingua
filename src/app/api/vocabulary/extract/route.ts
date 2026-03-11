import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { VocabularyExtractionSchema } from "@/lib/ai/vocabulary-schema";

const client = new Anthropic();

const RequestSchema = z.object({
  userMessage: z.string(),
  aiMessage: z.string(),
  language: z.enum(["es", "it"]),
  userLanguageId: z.string(),
  conversationId: z.string(),
});

export async function POST(req: NextRequest) {
  // Auth check — same pattern as all other routes
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate body
  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { userMessage, aiMessage, language, userLanguageId, conversationId } = parsed.data;
  const languageName = language === "es" ? "Spanish" : "Italian";

  // Extract vocabulary with retry logic — max 2 attempts
  let words: Array<{
    word: string;
    translation: string;
    partOfSpeech?: string | undefined;
    exampleSentence?: string | undefined;
  }> = [];

  let attempts = 0;
  while (attempts < 2) {
    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: `You are a vocabulary extraction tool for ${languageName} language learning.

Given a short conversation exchange, extract ${languageName} vocabulary words that a learner should study.

Rules:
- Only extract ${languageName} words (target language), never English
- Only include content words: nouns, verbs, adjectives, adverbs
- Skip: pronouns, articles (el/la/un/una/il/lo/etc), conjunctions, prepositions, proper nouns
- Skip any word that is already very basic/common (e.g. "sí", "no", "gracias", "hola")
- Aim for 3–8 words per exchange. Return fewer if the exchange is short or simple.
- translation must be in English
- exampleSentence must be a simple ${languageName} sentence using the word

Respond ONLY with valid JSON — no markdown, no code fences, no explanation:
{
  "words": [
    {
      "word": "${languageName} word",
      "translation": "English translation",
      "partOfSpeech": "noun" | "verb" | "adjective" | "adverb",
      "exampleSentence": "Simple ${languageName} sentence."
    }
  ]
}

If there are no words worth extracting, return: { "words": [] }`,
        messages: [
          {
            role: "user",
            content: `Extract vocabulary from this ${languageName} exchange:\n\nUser: ${userMessage}\nAI tutor: ${aiMessage}`,
          },
        ],
      });

      const raw =
        response.content[0]?.type === "text"
          ? (response.content[0] as { type: "text"; text: string }).text
          : "";

      const extracted = VocabularyExtractionSchema.parse(JSON.parse(raw));
      words = extracted.words;
      break; // success — exit retry loop
    } catch (err) {
      attempts++;
    }
  }

  // If both attempts failed, log and return silently — never interrupt the chat
  if (attempts === 2 && words.length === 0) {
    return NextResponse.json({ inserted: 0 });
  }

  if (words.length === 0) {
    return NextResponse.json({ inserted: 0 });
  }

  // Filter against words already in the DB for this user+language
  try {
    const existing = await prisma.vocabularyItem.findMany({
      where: { userLanguageId },
      select: { word: true },
    });
    const existingSet = new Set(existing.map((v) => v.word.toLowerCase()));

    const newWords = words.filter((w) => !existingSet.has(w.word.toLowerCase()));

    if (newWords.length === 0) {
      return NextResponse.json({ inserted: 0 });
    }

    // Insert new words — skipDuplicates as an extra safety net for race conditions
    const result = await prisma.vocabularyItem.createMany({
      data: newWords.map((w) => ({
        userLanguageId,
        word: w.word,
        translation: w.translation,
        partOfSpeech: w.partOfSpeech ?? null,
        exampleSentence: w.exampleSentence ?? null,
        sourceConversationId: conversationId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ inserted: result.count });
  } catch (err) {
    // DB failure — log silently, never surface to user
    return NextResponse.json({ inserted: 0 });
  }
}