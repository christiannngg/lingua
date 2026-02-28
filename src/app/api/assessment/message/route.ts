import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { buildAssessmentSystemPrompt } from "@/lib/ai/assessment-prompt";
import { AssessmentResultSchema, CEFR_DESCRIPTIONS } from "@/lib/ai/assessment-schema";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const client = new Anthropic();

// Schema for incoming request body
const RequestSchema = z.object({
  language: z.enum(["es", "it"]),
  userLanguageId: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
});

// Secondary AI call to extract structured CEFR result from the conversation
async function extractCefrResult(
  conversation: Array<{ role: "user" | "assistant"; content: string }>,
  language: "es" | "it",
): Promise<{ cefrLevel: string; description: string }> {
  const languageName = language === "es" ? "Spanish" : "Italian";

  const transcript = conversation.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

  let attempts = 0;

  while (attempts < 2) {
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: `You are a ${languageName} proficiency evaluator. Given a conversation transcript from a language assessment, determine the user's CEFR level.

You must handle these edge cases:
- If the user gave very short or evasive answers: rate based on what little was shown, bias toward A1-A2
- If the user replied mostly in English: treat English responses as failed ${languageName} attempts, bias toward A1
- If the user went off-topic: ignore off-topic content, rate only the ${languageName} produced
- If there is genuinely insufficient data: default to A1 with low confidence

Respond ONLY with valid JSON matching this exact shape — no markdown, no explanation, no code fences:
{
  "cefrLevel": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
  "confidence": "low" | "medium" | "high",
  "reasoning": "2-3 sentence explanation of your rating",
  "strengths": ["strength 1", "strength 2"],
  "areasToImprove": ["area 1", "area 2"]
}`,
        messages: [
          {
            role: "user",
            content: `Please evaluate this ${languageName} assessment conversation and return the CEFR rating as JSON:\n\n${transcript}`,
          },
        ],
      });

      const raw =
        response.content[0]?.type === "text"
          ? (response.content[0] as { type: "text"; text: string }).text
          : "";
      const parsed = AssessmentResultSchema.parse(JSON.parse(raw));

      // With this:
      return {
        cefrLevel: parsed.cefrLevel,
        description: CEFR_DESCRIPTIONS[parsed.cefrLevel as keyof typeof CEFR_DESCRIPTIONS],
      };
    } catch {
      attempts++;
    }
  }

  // Fallback after 2 failed attempts
  return { cefrLevel: "A1", description: CEFR_DESCRIPTIONS["A1"] };
}

export async function POST(req: NextRequest) {
  // Verify auth
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate request body
  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { language, userLanguageId, messages } = parsed.data;

  /// With this:
  const messagesForApi =
    messages.length === 0
      ? [{ role: "user" as const, content: "Hello, I'm ready to begin." }]
      : messages;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: buildAssessmentSystemPrompt(language),
    messages: messagesForApi,
  });

  const replyText =
    response.content[0]?.type === "text"
      ? (response.content[0] as { type: "text"; text: string }).text
      : "";

  const isComplete = replyText.includes("[ASSESSMENT_COMPLETE]");
  const cleanReply = replyText.replace("[ASSESSMENT_COMPLETE]", "").trim();

  // If assessment is done, run evaluator and persist result
  if (isComplete) {
    const allMessages = [...messages, { role: "assistant" as const, content: cleanReply }];

    const { cefrLevel, description } = await extractCefrResult(allMessages, language);

    await prisma.userLanguage.update({
      where: { id: userLanguageId },
      data: {
        cefrLevel,
        assessmentCompleted: true,
      },
    });

    return NextResponse.json({
      reply: cleanReply,
      isComplete: true,
      cefrLevel,
      cefrDescription: description,
    });
  }

  return NextResponse.json({
    reply: cleanReply,
    isComplete: false,
  });
}
