import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { VocabularyExtractionSchema } from "@/lib/ai/vocabulary-schema";

const client = new Anthropic();

const EXTRACTION_SYSTEM_PROMPT = (
  languageName: string,
) => `You are a vocabulary extraction tool for ${languageName} language learning.

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

If there are no words worth extracting, return: { "words": [] }`;

const EXTRACTION_USER_PROMPT = (languageName: string, userMessage: string, aiMessage: string) =>
  `Extract vocabulary from this ${languageName} exchange:\n\nUser: ${userMessage}\nAI tutor: ${aiMessage}`;

const CORRECTIVE_USER_PROMPT = (
  languageName: string,
  userMessage: string,
  aiMessage: string,
  rawBadOutput: string,
) =>
  `Extract vocabulary from this ${languageName} exchange:\n\nUser: ${userMessage}\nAI tutor: ${aiMessage}

Your previous response could not be parsed as valid JSON matching the required schema. 
Previous response: ${rawBadOutput}

You must respond ONLY with valid JSON matching exactly this shape — no markdown, no code fences:
{
  "words": [
    {
      "word": "string",
      "translation": "string",
      "partOfSpeech": "noun" | "verb" | "adjective" | "adverb",
      "exampleSentence": "string"
    }
  ]
}

If there are no words worth extracting, return: { "words": [] }`;

function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

export async function extractAndSaveVocabulary({
  userMessage,
  aiMessage,
  language,
  userLanguageId,
  conversationId,
}: {
  userMessage: string;
  aiMessage: string;
  language: "es" | "it";
  userLanguageId: string;
  conversationId: string;
}): Promise<void> {
  const languageName = language === "es" ? "Spanish" : "Italian";

  let words: Array<{
    word: string;
    translation: string;
    partOfSpeech?: string | undefined;
    exampleSentence?: string | undefined;
  }> = [];

  let attempts = 0;
  let lastRawOutput = "";

  while (attempts < 2) {
    try {
      // On the second attempt, use the corrective prompt that includes the bad output
      const userContent =
        attempts === 0
          ? EXTRACTION_USER_PROMPT(languageName, userMessage, aiMessage)
          : CORRECTIVE_USER_PROMPT(languageName, userMessage, aiMessage, lastRawOutput);

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: EXTRACTION_SYSTEM_PROMPT(languageName),
        messages: [{ role: "user", content: userContent }],
      });

      const raw =
        response.content[0]?.type === "text"
          ? (response.content[0] as { type: "text"; text: string }).text
          : "";

      lastRawOutput = raw;
      const cleaned = stripFences(raw);
      const extracted = VocabularyExtractionSchema.parse(JSON.parse(cleaned));
      words = extracted.words;
      break; // success
    } catch (err) {
      attempts++;
      // Only log parse/validation failures differently so we can distinguish
      // them from network errors in the logs
      if (err instanceof SyntaxError || (err instanceof Error && err.name === "ZodError")) {
        console.error(`[extractVocabulary] parse/validation failure on attempt ${attempts}:`, err);
      } else {
        console.error(`[extractVocabulary] attempt ${attempts} failed:`, err);
      }
    }
  }

  if (words.length === 0) {
    if (attempts === 2) {
      console.error("[extractVocabulary] failed after 2 attempts, skipping insert");
    }
    return;
  }

  try {
    const existing = await prisma.vocabularyItem.findMany({
      where: { userLanguageId },
      select: { word: true },
    });
    const existingSet = new Set(existing.map((v) => v.word.toLowerCase()));
    const newWords = words.filter((w) => !existingSet.has(w.word.toLowerCase()));

    if (newWords.length === 0) return;

    await prisma.vocabularyItem.createMany({
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
  } catch (err) {
    console.error("[extractVocabulary] DB insert failed:", err);
  }
}
