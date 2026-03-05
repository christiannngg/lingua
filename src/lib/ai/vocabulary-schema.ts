import { z } from "zod/v4";

export const VocabularyItemSchema = z.object({
  word: z.string(),
  translation: z.string(),
  partOfSpeech: z.string().optional(),
  exampleSentence: z.string().optional(),
});

export const VocabularyExtractionSchema = z.object({
  words: z.array(VocabularyItemSchema),
});

export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;
export type VocabularyExtraction = z.infer<typeof VocabularyExtractionSchema>;