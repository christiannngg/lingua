import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { buildAssessmentSystemPrompt } from "@/lib/ai/assessment-prompt";
import { AssessmentResultSchema, CEFR_DESCRIPTIONS } from "@/lib/ai/assessment-schema";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isSupportedLanguage, getLanguageDisplayName, type SupportedLanguage } from "@/lib/languages.config";
import { assessmentLimiter } from "@/ratelimit";

const client = new Anthropic();

const RequestSchema = z.object({
  language: z.string(),
  userLanguageId: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
});

async function extractCefrResult(
  conversation: Array<{ role: "user" | "assistant"; content: string }>,
  language: SupportedLanguage,
): Promise<{ cefrLevel: string; description: string }> {
  const languageName = getLanguageDisplayName(language);
  const transcript = conversation.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

  let attempts = 0;

  while (attempts < 2) {
    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
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
            content: `Please evaluate this ${languageName} assessment conversation and return the CEFR rating as JSON:\n\n<transcript>\n${transcript}\n</transcript>`,
          },
        ],
      });

      const raw =
        response.content[0]?.type === "text"
          ? (response.content[0] as { type: "text"; text: string }).text
          : "";
      const parsed = AssessmentResultSchema.parse(JSON.parse(raw));

      return {
        cefrLevel: parsed.cefrLevel,
        description: CEFR_DESCRIPTIONS[parsed.cefrLevel as keyof typeof CEFR_DESCRIPTIONS],
      };
    } catch {
      attempts++;
    }
  }

  return { cefrLevel: "A1", description: CEFR_DESCRIPTIONS["A1"] };
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limiting ──────────────────────────────────────────────────────
    const { success, limit, remaining, reset } = await assessmentLimiter.limit(session.user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }
    // ──────────────────────────────────────────────────────────────────────

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { language: rawLanguage, userLanguageId, messages } = parsed.data;

    if (!isSupportedLanguage(rawLanguage)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }
    const language = rawLanguage;

    // Ownership check
    const userLanguageOwner = await prisma.userLanguage.findUnique({
      where: { id: userLanguageId },
      select: { userId: true },
    });

    if (!userLanguageOwner || userLanguageOwner.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const messagesForApi =
      messages.length === 0
        ? [{ role: "user" as const, content: "Hello, I'm ready to begin." }]
        : messages;

    let response;
    try {
      response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: buildAssessmentSystemPrompt(language),
        messages: messagesForApi,
      });
    } catch (err) {
      console.error("[assessment/message] AI call failed:", err);
      return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
    }

    const replyText =
      response.content[0]?.type === "text"
        ? (response.content[0] as { type: "text"; text: string }).text
        : "";

    const isComplete = replyText.includes("[ASSESSMENT_COMPLETE]");
    const cleanReply = replyText.replace("[ASSESSMENT_COMPLETE]", "").trim();

    if (isComplete) {
      const allMessages = [...messages, { role: "assistant" as const, content: cleanReply }];

      const { cefrLevel, description } = await extractCefrResult(allMessages, language);

      try {
        await prisma.$transaction([
          prisma.userLanguage.update({
            where: { id: userLanguageId },
            data: { cefrLevel, assessmentCompleted: true },
          }),
          prisma.assessmentHistory.create({
            data: { userLanguageId, cefrLevel },
          }),
        ]);
      } catch (err) {
        console.error("[assessment/message] DB transaction failed:", err);
        return NextResponse.json({ error: "Failed to save assessment result" }, { status: 500 });
      }

      return NextResponse.json({
        reply: cleanReply,
        isComplete: true,
        cefrLevel,
        cefrDescription: description,
      });
    }

    return NextResponse.json({ reply: cleanReply, isComplete: false });
  } catch (err) {
    console.error("[assessment/message] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}