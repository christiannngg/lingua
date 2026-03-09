// ─────────────────────────────────────────────────────────────────────────────
// Sentence Generation Prompt
// Pure function — no imports, no side effects, fully testable.
// ─────────────────────────────────────────────────────────────────────────────

import { getLanguageDisplayName } from "@/lib/languages.config";

const CEFR_GUIDANCE: Record<string, string> = {
  A1: "Use only the most basic vocabulary and simple present tense. Very short sentences (5-8 words).",
  A2: "Use common everyday vocabulary and basic tenses (present, simple past). Short sentences (6-10 words).",
  B1: "Use intermediate vocabulary and a range of tenses. Medium sentences (8-12 words).",
  B2: "Use varied vocabulary including idiomatic expressions. Natural sentences (10-15 words).",
  C1: "Use sophisticated vocabulary and complex structures. Rich, nuanced sentences.",
  C2: "Use advanced, precise vocabulary with complex grammar. Sentences should feel like native writing.",
};

interface SentenceGenerationPromptParams {
  word: string;
  translation: string;
  partOfSpeech: string | null;
  language: string;
  cefrLevel: string;
  conversationTopics: string[];
  previousSentence: string | null;
}

export function buildSentenceGenerationPrompt(
  params: SentenceGenerationPromptParams
): string {
  const {
    word,
    translation,
    partOfSpeech,
    language,
    cefrLevel,
    conversationTopics,
    previousSentence,
  } = params;

  const languageName = getLanguageDisplayName(language);
  const levelGuidance = CEFR_GUIDANCE[cefrLevel] ?? CEFR_GUIDANCE["A1"];

  const topicsLine =
    conversationTopics.length > 0
      ? `The user has recently talked about: ${conversationTopics.join(", ")}. If one of these topics fits naturally with the word, use it as context for the sentence — but do not force it.`
      : "No recent conversation topics available. Use a natural, everyday context.";

  const avoidanceLine = previousSentence
    ? `Do NOT use this sentence or anything similar to it: "${previousSentence}"`
    : "";

  const posLine = partOfSpeech ? `Part of speech: ${partOfSpeech}` : "";

  return `Generate one example sentence in ${languageName} using the word "${word}" (${translation}).${posLine ? `\n${posLine}` : ""}

CEFR Level: ${cefrLevel}
Level requirement: ${levelGuidance}

${topicsLine}
${avoidanceLine ? `\n${avoidanceLine}` : ""}
Today's date: ${new Date().toISOString().slice(0, 10)} (use this to naturally vary your output across sessions)

Rules:
- Write ONLY the ${languageName} sentence — no translation, no explanation, no punctuation beyond the sentence
- The word "${word}" must appear in the sentence exactly as written
- The sentence must sound natural to a native speaker
- Respect the CEFR level strictly — do not use vocabulary above ${cefrLevel}`.trim();
}