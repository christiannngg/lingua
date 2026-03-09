import z from "zod/v4";
import { SUPPORTED_LANGUAGE_CODES, type SupportedLanguage } from "@/lib/languages.config";

export const CefrLevel = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export type CefrLevel = z.infer<typeof CefrLevel>;

// Derived from languages.config — adding a new language there automatically
// expands this enum. The cast is required because z.enum() needs a
// non-empty tuple, which SUPPORTED_LANGUAGE_CODES satisfies at runtime.
export const SupportedLanguageSchema = z.enum(
  SUPPORTED_LANGUAGE_CODES as unknown as [string, ...string[]],
);

// Re-export the type from config so consumers can import from one place
export type { SupportedLanguage };

export const AssessmentResultSchema = z.object({
  cefrLevel: CefrLevel,
  confidence: z.enum(["low", "medium", "high"]),
  reasoning: z.string().min(10),
  strengths: z.array(z.string()).min(1).max(3),
  areasToImprove: z.array(z.string()).min(1).max(3),
});

export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;

export const CEFR_DESCRIPTIONS: Record<CefrLevel, string> = {
  A1: "Beginner — you know greetings and basic words. Every expert started here!",
  A2: "Elementary — you can handle simple, everyday conversations.",
  B1: "Intermediate — you can get by in most real-world situations.",
  B2: "Upper Intermediate — you're conversational and confident on most topics.",
  C1: "Advanced — you express yourself with ease and sophistication.",
  C2: "Mastery — you're operating at near-native fluency. Impressive!",
};