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
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { userMessage, aiMessage, language, userLanguageId, conversationId } = parsed.data;
  const languageName = language === "es" ? "Spanish" : "Italian";

  let words: Array<{
    word: string;
    lemma: string;
    translation: string;
    partOfSpeech?: string | undefined;
    exampleSentence?: string | undefined;
  }> = [];

  let attempts = 0;
  let lastRawOutput = "";

  while (attempts < 2) {
    try {
      const userContent =
        attempts === 0
          ? `Extract vocabulary from this ${languageName} exchange:\n\nUser: ${userMessage}\nAI tutor: ${aiMessage}`
          : `Extract vocabulary from this ${languageName} exchange:\n\nUser: ${userMessage}\nAI tutor: ${aiMessage}

Your previous response could not be parsed as valid JSON matching the required schema.
Previous response: ${lastRawOutput}

You must respond ONLY with valid JSON matching exactly this shape — no markdown, no code fences:
{
  "words": [
    {
      "word": "string",
      "lemma": "string",
      "translation": "string",
      "partOfSpeech": "noun" | "verb" | "adjective" | "adverb",
      "exampleSentence": "string"
    }
  ]
}

If there are no words worth extracting, return: { "words": [] }`;

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
- exampleSentence must be a simple ${languageName} sentence using the CANONICAL form of the word

CANONICAL FORM RULES — always extract the dictionary/lemma form, never an inflected form:
- Nouns: masculine singular where applicable (casa not casas, libro not libros)
- Adjectives: masculine singular (alto not alta/altos/altas, grande not grandes, bueno not buena)
- Verbs: infinitive always (hablar not habló/hablando/hablaba/hablamos, essere not sono/era)
- Adverbs: extract as-is (rápidamente, facilmente)
- If you see "altas" in the text, extract "alto". If you see "hablamos", extract "hablar".

The "word" field is what appeared in the conversation. The "lemma" field is always the canonical dictionary form.
Example: { "word": "altas", "lemma": "alto", ... }
Example: { "word": "hablamos", "lemma": "hablar", ... }
Example: { "word": "casa", "lemma": "casa", ... }

Respond ONLY with valid JSON — no markdown, no code fences, no explanation:
{
  "words": [
    {
      "word": "${languageName} word as it appeared in the conversation",
      "lemma": "canonical dictionary form",
      "translation": "English translation",
      "partOfSpeech": "noun" | "verb" | "adjective" | "adverb",
      "exampleSentence": "Simple ${languageName} sentence using the canonical form."
    }
  ]
}

If there are no words worth extracting, return: { "words": [] }`,
        messages: [{ role: "user", content: userContent }],
      });

      const raw =
        response.content[0]?.type === "text"
          ? (response.content[0] as { type: "text"; text: string }).text
          : "";

      lastRawOutput = raw;
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      const extracted = VocabularyExtractionSchema.parse(JSON.parse(cleaned));
      words = extracted.words;
      break;
    } catch (err) {
      attempts++;
      console.error(`[extract/route] attempt ${attempts} failed:`, err);
    }
  }

  if (words.length === 0) {
    return NextResponse.json({ inserted: 0 });
  }

  try {
    // Upsert on lemma — the @@unique([userLanguageId, lemma]) constraint
    // guarantees no duplicates. update: {} means a re-encountered lemma
    // never overwrites existing FSRS state.
    const results = await prisma.$transaction(
      words.map((w) =>
        prisma.vocabularyItem.upsert({
          where: {
            userLanguageId_lemma: {
              userLanguageId,
              lemma: w.lemma,
            },
          },
          create: {
            userLanguageId,
            word: w.word,
            lemma: w.lemma,
            translation: w.translation,
            partOfSpeech: w.partOfSpeech ?? null,
            exampleSentence: w.exampleSentence ?? null,
            sourceConversationId: conversationId,
          },
          update: {}, // already exists — never reset FSRS state
        })
      )
    );

    return NextResponse.json({ inserted: results.length });
  } catch (err) {
    console.error("[extract/route] DB upsert failed:", err);
    return NextResponse.json({ inserted: 0 });
  }
}