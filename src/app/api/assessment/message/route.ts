import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { buildAssessmentSystemPrompt, type SelfReportBand } from "@/lib/ai/assessment-prompt";
import {
  AssessmentResultSchema,
  CEFR_DESCRIPTIONS,
  applyConfidenceThreshold,
} from "@/lib/ai/assessment-schema";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  isSupportedLanguage,
  getLanguageDisplayName,
  type SupportedLanguage,
} from "@/lib/languages.config";
import { assessmentLimiter } from "@/ratelimit";

const client = new Anthropic();

const MAX_TURNS = 8;

const RequestSchema = z.object({
  language: z.string(),
  userLanguageId: z.string(),
  conversationId: z.string(),
  // Null on the first turn — the AI speaks first
  userMessage: z.string().nullable(),
  selfReportBand: z.enum(["A1", "A2", "B1", "C1"]).nullable().optional(),
});

async function extractCefrResult(
  conversation: Array<{ role: "user" | "assistant"; content: string }>,
  language: SupportedLanguage,
  selfReportBand?: SelfReportBand | null,
): Promise<{ cefrLevel: string; description: string }> {
  const languageName = getLanguageDisplayName(language);
  const transcript = conversation.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

  const selfReportNote = selfReportBand
    ? `\nNote: The user self-reported their level as approximately ${selfReportBand} before the conversation. Use this as a soft prior — weight your rating accordingly, but correct it if the conversation evidence clearly points elsewhere.\n`
    : "";

  let attempts = 0;

  while (attempts < 2) {
    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: `You are a ${languageName} proficiency evaluator. Given a conversation transcript from a language assessment, determine the user's CEFR level.
${selfReportNote}
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
      const finalLevel = applyConfidenceThreshold(parsed.cefrLevel, parsed.confidence);

      return {
        cefrLevel: finalLevel,
        description: CEFR_DESCRIPTIONS[finalLevel],
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

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { language: rawLanguage, userLanguageId, conversationId, userMessage, selfReportBand } =
      parsed.data;

    if (!isSupportedLanguage(rawLanguage)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }
    const language = rawLanguage;

    // Ownership check — verify both the userLanguage and the conversation belong to this user
    const userLanguageOwner = await prisma.userLanguage.findUnique({
      where: { id: userLanguageId },
      select: {
        userId: true,
        conversations: {
          where: { id: conversationId },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!userLanguageOwner || userLanguageOwner.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (userLanguageOwner.conversations.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Persist the user message before the AI call so it's never lost on failure
    if (userMessage) {
      await prisma.message.create({
        data: { conversationId, role: "user", content: userMessage },
      });
    }

    // Load the full conversation history from the database.
    const dbMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    // Server-side turn counter: number of assistant messages already stored
    const turnCount = dbMessages.filter((m) => m.role === "assistant").length;

    const messagesForApi =
      dbMessages.length === 0
        ? [{ role: "user" as const, content: "Hello, I'm ready to begin." }]
        : dbMessages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

    let response;
    try {
      response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: buildAssessmentSystemPrompt(language, selfReportBand, turnCount),
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

    const tokenFound = replyText.toLowerCase().includes("[assessment_complete]");
    // Force-complete at MAX_TURNS even if the AI forgot the token
    const isComplete = tokenFound || turnCount + 1 >= MAX_TURNS;
    const cleanReply = replyText.replace(/\[assessment_complete\]/i, "").trim();

    // Persist the assistant message
    await prisma.message.create({
      data: { conversationId, role: "assistant", content: cleanReply },
    });

    if (isComplete) {
      // Use the full DB-sourced transcript for the judge — not client-assembled messages
      const allMessages = [
        ...dbMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "assistant" as const, content: cleanReply },
      ];

      const { cefrLevel, description } = await extractCefrResult(
        allMessages,
        language,
        selfReportBand,
      );

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