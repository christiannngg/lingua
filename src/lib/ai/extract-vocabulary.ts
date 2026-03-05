import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { VocabularyExtractionSchema } from "@/lib/ai/vocabulary-schema";

const client = new Anthropic();

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

      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
      const extracted = VocabularyExtractionSchema.parse(JSON.parse(cleaned));
      words = extracted.words;
      break;
    } catch (err) {
      attempts++;
      console.error(`[extractVocabulary] attempt ${attempts} failed:`, err);
    }
  }

  if (words.length === 0) {
    if (attempts === 2) {
      console.error("[extractVocabulary] failed after 2 attempts, skipping insert");
    }
    return;
  }

  const existing = await prisma.vocabularyItem.findMany({
    where: { userLanguageId },
    select: { word: true },
  });
  const existingSet = new Set(existing.map((v) => v.word.toLowerCase()));
  const newWords = words.filter((w) => !existingSet.has(w.word.toLowerCase()));

  if (newWords.length === 0) return;

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
}
