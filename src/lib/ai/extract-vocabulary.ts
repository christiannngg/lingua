import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { VocabularyExtractionSchema } from "@/lib/ai/vocabulary-schema";
import { getLanguageDisplayName, type SupportedLanguage } from "@/lib/languages.config";

const client = new Anthropic();

const EXTRACTION_SYSTEM_PROMPT = (languageName: string) =>
  `You are a vocabulary extraction tool for ${languageName} language learning.

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
      "lemma": "string", 
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
  language: SupportedLanguage;
  userLanguageId: string;
  conversationId: string;
}): Promise<void> {
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
      break;
    } catch (err) {
      attempts++;
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
    // ── Skip the O(n) findMany + existingSet filter ───────────────────────
    // The @@unique([userLanguageId, word]) constraint on VocabularyItem
    // guarantees no duplicates at the DB level. skipDuplicates silently
    // drops any word that already exists — no pre-fetch needed.
    await prisma.$transaction(
      words.map((w) =>
        prisma.vocabularyItem.upsert({
          where: {
            userLanguageId_lemma: {
              // updated unique constraint name
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
          update: {}, // already exists — don't overwrite anything, FSRS state stays intact
        }),
      ),
    );
  } catch (err) {
    console.error("[extractVocabulary] DB insert failed:", err);
  }
}
