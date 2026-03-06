import { z } from "zod/v4";

export const GrammarErrorItemSchema = z.object({
  concept: z.string(),         // must match a name from GRAMMAR_CONCEPTS[language]
  userSentence: z.string(),    // the exact phrase/sentence the user wrote with the error
  correction: z.string(),      // the corrected version
  explanation: z.string(),     // brief plain-English explanation of the mistake
});

export const GrammarExtractionSchema = z.object({
  errors: z.array(GrammarErrorItemSchema),
});

export type GrammarErrorItem = z.infer<typeof GrammarErrorItemSchema>;
export type GrammarExtraction = z.infer<typeof GrammarExtractionSchema>;