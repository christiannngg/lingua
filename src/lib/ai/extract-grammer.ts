import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { GrammarExtractionSchema } from "@/lib/ai/grammar-schema";
import { GRAMMAR_CONCEPTS } from "@/lib/ai/grammar-concepts";

const client = new Anthropic();

export async function extractAndSaveGrammar({
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
  const conceptNames = GRAMMAR_CONCEPTS[language].map((c) => c.name);
  const conceptList = conceptNames.map((n) => `"${n}"`).join(" | ");

  let errors: Array<{
    concept: string;
    userSentence: string;
    correction: string;
    explanation: string;
  }> = [];

  let attempts = 0;
  while (attempts < 2) {
    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: `You are a ${languageName} grammar error detector for language learners.

Analyze ONLY the user's message for grammar mistakes. The AI tutor's message is provided as context only.

Rules:
- Only flag genuine grammar errors, not stylistic choices or informal language
- Only categorize errors using EXACTLY one of these concept names: ${conceptList}
- If the user's message has no grammar errors, return { "errors": [] }
- userSentence: copy the exact phrase or clause containing the error
- correction: the corrected version of that phrase or clause
- explanation: one plain-English sentence explaining the mistake
- Maximum 3 errors per message — prioritize the most important ones

Respond ONLY with valid JSON — no markdown, no code fences, no explanation:
{
  "errors": [
    {
      "concept": "one of the concept names above",
      "userSentence": "what the user wrote",
      "correction": "corrected version",
      "explanation": "brief explanation in English"
    }
  ]
}`,
        messages: [
          {
            role: "user",
            content: `User's message (analyze this for errors): "${userMessage}"\n\nAI tutor's response (context only): "${aiMessage}"`,
          },
        ],
      });

      const raw =
        response.content[0]?.type === "text"
          ? (response.content[0] as { type: "text"; text: string }).text
          : "";

      // Strip markdown fences (Haiku sometimes wraps output despite instructions)
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      const extracted = GrammarExtractionSchema.parse(JSON.parse(cleaned));

      // Filter out any concepts Claude invented outside our predefined list
      errors = extracted.errors.filter((e) =>
        conceptNames.includes(e.concept as (typeof conceptNames)[number]),
      );

      break; // success
    } catch (err) {
      attempts++;
      console.error(`[extractGrammar] attempt ${attempts} failed:`, err);
    }
  }

  if (errors.length === 0) {
    if (attempts === 2) {
      console.error("[extractGrammar] failed after 2 attempts, skipping insert");
    }
    return;
  }

  // Persist each error — upsert mastery row + insert error occurrence
  for (const error of errors) {
    try {
      // Look up the concept row (seeded at migration time)
      const concept = await prisma.grammarConcept.findUnique({
        where: { language_name: { language, name: error.concept } },
      });

      if (!concept) {
        console.warn(`[extractGrammar] unknown concept "${error.concept}" for language "${language}", skipping`);
        continue;
      }

      // Upsert mastery: increment errorCount and update lastSeenAt
      await prisma.userGrammarMastery.upsert({
        where: {
          userLanguageId_grammarConceptId: {
            userLanguageId,
            grammarConceptId: concept.id,
          },
        },
        update: {
          errorCount: { increment: 1 },
          lastSeenAt: new Date(),
        },
        create: {
          userLanguageId,
          grammarConceptId: concept.id,
          errorCount: 1,
          lastSeenAt: new Date(),
        },
      });

      // Insert the individual error occurrence for S6-03 drill-down
      await prisma.grammarError.create({
        data: {
          userLanguageId,
          grammarConceptId: concept.id,
          conversationId,
          userSentence: error.userSentence,
          correction: error.correction,
          explanation: error.explanation,
        },
      });
    } catch (err) {
      // Per-error failure — log and continue, don't abort the whole batch
      console.error(`[extractGrammar] failed to persist concept "${error.concept}":`, err);
    }
  }

  console.log(
    `[extractGrammar] processed ${errors.length} error(s) for userLanguageId=${userLanguageId}`,
  );
}