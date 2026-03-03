import z from "zod/v4";

export const CefrLevel = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export type CefrLevel = z.infer<typeof CefrLevel>;
export const SupportedLanguage = z.enum(["es", "it"]);
export type SupportedLanguage = z.infer<typeof SupportedLanguage>;

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