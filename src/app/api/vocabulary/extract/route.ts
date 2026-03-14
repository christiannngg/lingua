import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { VocabularyExtractionSchema } from "@/lib/ai/vocabulary-schema";
import { SUPPORTED_LANGUAGE_CODES, getLanguageDisplayName } from "@/lib/languages.config";
import { extractLimiter } from "@/ratelimit";

const client = new Anthropic();

const RequestSchema = z.object({
  userMessage: z.string(),
  aiMessage: z.string(),
  language: z.enum(SUPPORTED_LANGUAGE_CODES),
  userLanguageId: z.string(),
  conversationId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Rate limiting ────────────────────────────────────────────────────────
  const { success, limit, remaining, reset } = await extractLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      },
    );
  }
  // ────────────────────────────────────────────────────────────────────────

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { userMessage, aiMessage, language, userLanguageId, conversationId } = parsed.data;

  // ── Ownership check ──────────────────────────────────────────────────────
  const userLanguage = await prisma.userLanguage.findUnique({
    where: { id: userLanguageId },
    select: { userId: true },
  });

  if (!userLanguage || userLanguage.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  // ────────────────────────────────────────────────────────────────────────

  // Derive language name from config — never hardcode per-language strings here
  const languageName = getLanguageDisplayName(language);

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
          update: {},
        })
      )
    );

    return NextResponse.json({ inserted: results.length });
  } catch (err) {
    console.error("[extract/route] DB upsert failed:", err);
    return NextResponse.json({ inserted: 0 });
  }
}