import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { VocabularyExtractionSchema } from "@/lib/ai/vocabulary-schema";
import { getLanguageDisplayName, type SupportedLanguage } from "@/lib/languages.config";

const client = new Anthropic();

// ---------------------------------------------------------------------------
// Language-aware prompt helpers
// ---------------------------------------------------------------------------

/**
 * Returns skip rules for parts of speech that are never worth extracting,
 * with language-specific additions for particles, measure words, etc.
 */
function getSkipRules(language: SupportedLanguage): string {
  const base =
    "- Skip: pronouns, conjunctions, prepositions, proper nouns\n" +
    "- Skip any word that is already very basic/common (e.g. greetings, yes/no equivalents)";

  const extra: Partial<Record<SupportedLanguage, string>> = {
    es: "- Skip: articles (el, la, los, las, un, una, unos, unas)",
    it: "- Skip: articles (il, lo, la, i, gli, le, un, uno, una)",
    fr: "- Skip: articles (le, la, les, l', un, une, des)",
    pt: "- Skip: articles (o, a, os, as, um, uma, uns, umas)",
    de: "- Skip: articles (der, die, das, ein, eine, etc.) and modal particles (ja, doch, mal, etc.)",
    ja:
      "- Skip: particles (は, が, を, に, へ, で, から, まで, と, や, の, か, ね, よ, etc.)\n" +
      "- Skip: auxiliary verbs (です, ます, ている, etc.) as standalone items\n" +
      "- Skip: demonstratives (これ, それ, あれ, この, その)",
    zh:
      "- Skip: aspect particles (了, 着, 过) as standalone items\n" +
      "- Skip: structural particles (的, 地, 得)\n" +
      "- Skip: measure words (个, 本, 条, etc.) as standalone items — only extract them as part of a full noun phrase if the learner would benefit",
    ko:
      "- Skip: topic/subject/object particles (은/는, 이/가, 을/를, 에서, 에게, 한테, etc.)\n" +
      "- Skip: sentence-final endings (요, 어/아, 습니다, etc.) as standalone items\n" +
      "- Skip: demonstratives (이것, 그것, 저것)",
    ru: "- Skip: short-form pronouns and common particles (же, ли, бы, ведь, etc.)",
  };

  return `${base}\n${extra[language] ?? ""}`.trim();
}

/**
 * Returns canonical form rules tailored to the morphological character
 * of each language family.
 */
function getCanonicalFormRules(language: SupportedLanguage): string {
  switch (language) {
    // ── Isolating: no inflection, extract base form as-is ──────────────────
    case "zh":
      return `CANONICAL FORM RULES:
- Chinese has no inflection. Extract the base word or compound exactly as it appears.
- Verbs: extract the bare verb (说, 吃, 去 — not 在说 or 说了)
- Adjectives: extract as-is (漂亮, 快, 高)
- Nouns: extract the base noun without measure words (书 not 一本书, 猫 not 三只猫)
- Example: if you see "在吃饭", extract "吃饭" (eat/have a meal)`;

    // ── Japanese: dictionary form ───────────────────────────────────────────
    case "ja":
      return `CANONICAL FORM RULES:
- Verbs: always extract the dictionary (plain non-past) form
  - u-verbs: 書きます -> 書く, 話した -> 話す
  - ru-verbs: 食べています -> 食べる, 見ました -> 見る
  - irregular: します -> する, きます -> くる
- い-adjectives: dictionary form (美しかった -> 美しい, 高くない -> 高い)
- な-adjectives: stem only, no な (きれいな -> きれい, 静かだ -> 静か)
- Nouns: extract as-is, no changes needed
- Example: if you see "食べました", extract "食べる"`;

    // ── Korean: dictionary form ─────────────────────────────────────────────
    case "ko":
      return `CANONICAL FORM RULES:
- Verbs: always extract the dictionary form ending in 다
  - 먹어요 -> 먹다, 갔습니다 -> 가다, 공부하고 -> 공부하다
- Adjectives: dictionary form ending in 다 (예쁜 -> 예쁘다, 작아서 -> 작다)
- Nouns: extract as-is, without any attached particles
  - 학교에서 -> 학교, 친구를 -> 친구
- Example: if you see "공부했어요", extract "공부하다"`;

    // ── German: nominative singular, infinitive ─────────────────────────────
    case "de":
      return `CANONICAL FORM RULES:
- Nouns: nominative singular (dem Mann -> Mann, die Bücher -> Buch)
  Preserve the capital letter — all German nouns are capitalized.
- Verbs: infinitive always (hat gegessen -> essen, bin gegangen -> gehen, spricht -> sprechen)
- Adjectives: uninflected/predicative form (dem schönen -> schön, einen großen -> groß)
- Adverbs: extract as-is (schnell, leider, eigentlich)
- Example: if you see "gegessen", extract "essen"; if you see "Büchern", extract "Buch"`;

    // ── Russian: nominative singular, imperfective infinitive ───────────────
    case "ru":
      return `CANONICAL FORM RULES:
- Nouns: nominative singular (книги -> книга, столу -> стол, домов -> дом)
- Verbs: imperfective infinitive unless the perfective is the more natural citation form
  (читал -> читать, написала -> написать, говорит -> говорить)
- Adjectives: masculine nominative singular (красивой -> красивый, хорошего -> хороший)
- Adverbs: extract as-is (быстро, хорошо, очень — though skip очень as too basic)
- Example: if you see "написала", extract "написать"; if you see "красивую", extract "красивый"`;

    // ── Portuguese: masculine singular, infinitive ──────────────────────────
    case "pt":
      return `CANONICAL FORM RULES:
- Nouns: masculine singular where applicable (casas -> casa, livros -> livro)
- Verbs: infinitive always (falei -> falar, comemos -> comer, foi -> ir)
- Adjectives: masculine singular (bonitas -> bonito, grandes -> grande)
- Adverbs: extract as-is (rapidamente, bem, muito — though skip muito as too basic)
- Example: if you see "falamos", extract "falar"; if you see "bonitas", extract "bonito"`;

    // ── French: masculine singular, infinitive ──────────────────────────────
    case "fr":
      return `CANONICAL FORM RULES:
- Nouns: masculine singular where applicable (maisons -> maison, livres -> livre)
- Verbs: infinitive always (parlais -> parler, sommes allés -> aller, mange -> manger)
- Adjectives: masculine singular (belles -> beau, grandes -> grand, petite -> petit)
- Adverbs: extract as-is (rapidement, bien, vraiment)
- Example: if you see "sommes allés", extract "aller"; if you see "belles", extract "beau"`;

    // ── Italian: masculine singular, infinitive ─────────────────────────────
    case "it":
      return `CANONICAL FORM RULES:
- Nouns: masculine singular where applicable (case -> casa, libri -> libro)
- Verbs: infinitive always (mangiavo -> mangiare, sono andato -> andare, parla -> parlare)
- Adjectives: masculine singular (alta -> alto, belle -> bello, grandi -> grande)
- Adverbs: extract as-is (velocemente, bene, davvero)
- Example: if you see "mangiavamo", extract "mangiare"; if you see "altas" -> "alto"`;

    // ── Spanish: masculine singular, infinitive (default) ───────────────────
    case "es":
    default:
      return `CANONICAL FORM RULES:
- Nouns: masculine singular where applicable (casas -> casa, libros -> libro)
- Verbs: infinitive always (habló -> hablar, hablando -> hablar, hablamos -> hablar)
- Adjectives: masculine singular (alta -> alto, altas -> alto, buenos -> bueno)
- Adverbs: extract as-is (rápidamente, bien, realmente)
- Example: if you see "hablamos", extract "hablar"; if you see "altas", extract "alto"`;
  }
}

/**
 * Returns a word-count guideline appropriate for the language.
 * CJK conversations pack more vocabulary density.
 */
function getWordCountGuidance(language: SupportedLanguage): string {
  const cjk: SupportedLanguage[] = ["zh", "ja", "ko"];
  return cjk.includes(language)
    ? "Aim for 4–10 words per exchange. Return fewer if the exchange is short or simple."
    : "Aim for 3–8 words per exchange. Return fewer if the exchange is short or simple.";
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildSystemPrompt(language: SupportedLanguage, languageName: string): string {
  return `You are a vocabulary extraction tool for ${languageName} language learning.

Given a short conversation exchange, extract ${languageName} vocabulary words that a learner should study.

Rules:
- Only extract ${languageName} words (target language), never English
- Only include content words: nouns, verbs, adjectives, adverbs
${getSkipRules(language)}
- ${getWordCountGuidance(language)}
- translation must be in English
- exampleSentence must be a simple ${languageName} sentence using the CANONICAL form of the word

${getCanonicalFormRules(language)}

The "word" field is what appeared in the conversation. The "lemma" field is always the canonical dictionary form.

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
}

function buildExtractionPrompt(
  languageName: string,
  userMessage: string,
  aiMessage: string,
): string {
  return `Extract vocabulary from this ${languageName} exchange:\n\nUser: ${userMessage}\nAI tutor: ${aiMessage}`;
}

function buildCorrectivePrompt(
  languageName: string,
  userMessage: string,
  aiMessage: string,
  rawBadOutput: string,
): string {
  return `Extract vocabulary from this ${languageName} exchange:\n\nUser: ${userMessage}\nAI tutor: ${aiMessage}

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
}

function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Shared extraction + DB write logic
// ---------------------------------------------------------------------------

type ExtractedWord = {
  word: string;
  lemma: string;
  translation: string;
  partOfSpeech?: string | undefined;
  exampleSentence?: string | undefined;
};

/**
 * Calls Claude to extract vocabulary from a conversation exchange and
 * upserts the results into vocabulary_items. Safe to call fire-and-forget.
 *
 * This is the single implementation used by both the server action path
 * (onFinish callback) and the API route. The route delegates here rather
 * than reimplementing the prompt logic.
 */
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
  const systemPrompt = buildSystemPrompt(language, languageName);

  let words: ExtractedWord[] = [];
  let attempts = 0;
  let lastRawOutput = "";

  while (attempts < 2) {
    try {
      const userContent =
        attempts === 0
          ? buildExtractionPrompt(languageName, userMessage, aiMessage)
          : buildCorrectivePrompt(languageName, userMessage, aiMessage, lastRawOutput);

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
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
    await prisma.$transaction(
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
          update: {}, // already exists — FSRS state is preserved
        }),
      ),
    );
  } catch (err) {
    console.error("[extractVocabulary] DB insert failed:", err);
  }
}
