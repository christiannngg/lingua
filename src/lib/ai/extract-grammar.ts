import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { GrammarExtractionSchema } from "@/lib/ai/grammar-schema";
import { GRAMMAR_CONCEPTS } from "@/lib/ai/grammar-concepts";
import { getLanguageDisplayName, type SupportedLanguage } from "@/lib/languages.config";

const client = new Anthropic();

const EXTRACTION_SYSTEM_PROMPT = (languageName: string, conceptList: string) =>
  `You are a ${languageName} grammar error detector for language learners.

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
}`;

const EXTRACTION_USER_PROMPT = (userMessage: string, aiMessage: string, languageName: string) =>
  `User's message (analyze this for errors): "${userMessage}"\n\nAI tutor's response (context only): "${aiMessage}"`;

const CORRECTIVE_USER_PROMPT = (
  userMessage: string,
  aiMessage: string,
  languageName: string,
  conceptList: string,
  rawBadOutput: string,
) =>
  `User's message (analyze this for errors): "${userMessage}"\n\nAI tutor's response (context only): "${aiMessage}"

Your previous response could not be parsed as valid JSON matching the required schema.
Previous response: ${rawBadOutput}

You must respond ONLY with valid JSON matching exactly this shape — no markdown, no code fences:
{
  "errors": [
    {
      "concept": "must be exactly one of: ${conceptList}",
      "userSentence": "string",
      "correction": "string",
      "explanation": "string"
    }
  ]
}

If there are no errors, return: { "errors": [] }`;

function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

export async function extractAndSaveGrammar({
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
  const conceptNames = GRAMMAR_CONCEPTS[language].map((c) => c.name);
  const conceptList = conceptNames.map((n) => `"${n}"`).join(" | ");

  let errors: Array<{
    concept: string;
    userSentence: string;
    correction: string;
    explanation: string;
  }> = [];

  let attempts = 0;
  let lastRawOutput = "";

  while (attempts < 2) {
    try {
      const userContent =
        attempts === 0
          ? EXTRACTION_USER_PROMPT(userMessage, aiMessage, languageName)
          : CORRECTIVE_USER_PROMPT(
              userMessage,
              aiMessage,
              languageName,
              conceptList,
              lastRawOutput,
            );

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: EXTRACTION_SYSTEM_PROMPT(languageName, conceptList),
        messages: [{ role: "user", content: userContent }],
      });

      const raw =
        response.content[0]?.type === "text"
          ? (response.content[0] as { type: "text"; text: string }).text
          : "";

      lastRawOutput = raw;
      const cleaned = stripFences(raw);
      const extracted = GrammarExtractionSchema.parse(JSON.parse(cleaned));

      errors = extracted.errors.filter((e) =>
        conceptNames.includes(e.concept as (typeof conceptNames)[number]),
      );

      break;
    } catch (err) {
      attempts++;
      if (err instanceof SyntaxError || (err instanceof Error && err.name === "ZodError")) {
        console.error(`[extractGrammar] parse/validation failure on attempt ${attempts}:`, err);
      } else {
        console.error(`[extractGrammar] attempt ${attempts} failed:`, err);
      }
    }
  }

  if (errors.length === 0) {
    if (attempts === 2) {
      console.error("[extractGrammar] failed after 2 attempts, skipping insert");
    }
    return;
  }

  // ── Parallelise DB writes across all errors ──────────────────────────────
  // Each error's concept lookup, mastery upsert, and error insert are
  // independent of the others — no reason to pay for sequential round-trips.
  await Promise.all(
    errors.map(async (error) => {
      try {
        const concept = await prisma.grammarConcept.findUnique({
          where: { language_name: { language, name: error.concept } },
        });

        if (!concept) {
          console.warn(
            `[extractGrammar] unknown concept "${error.concept}" for language "${language}", skipping`,
          );
          return;
        }

        // Upsert mastery and insert error record — these two are dependent on
        // the concept lookup above but independent across different errors,
        // so we await them sequentially only within each error's own task.
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
        console.error(`[extractGrammar] failed to persist concept "${error.concept}":`, err);
      }
    }),
  );
}