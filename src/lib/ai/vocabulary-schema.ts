import { z } from "zod/v4";

export const VocabularyItemSchema = z.object({
  word: z.string(),
  lemma: z.string(),
  translation: z.string(),
  partOfSpeech: z.enum(["noun", "verb", "adjective", "adverb"]).optional(),
  exampleSentence: z.string().optional(),
});

export const VocabularyExtractionSchema = z.object({
  words: z.array(VocabularyItemSchema),
});

export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;
export type VocabularyExtraction = z.infer<typeof VocabularyExtractionSchema>;
