import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { buildConversationSystemPrompt, buildMemoryMessage } from "@/lib/ai/conversation-prompt";
import { extractAndSaveVocabulary } from "@/lib/ai/extract-vocabulary";
import { extractAndSaveGrammar } from "@/lib/ai/extract-grammar";
import { embedConversation } from "@/lib/embeddings";
import { retrieveRelevantMemory } from "@/lib/ai/retrieve-memory";
import { isSupportedLanguage, type SupportedLanguage } from "@/lib/languages.config";

const anthropic = createAnthropic();

type MessagePart = { type: string; text?: string | undefined };

const RequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      parts: z.array(z.object({ type: z.string(), text: z.string().optional() })),
    }),
  ),
  language: z.string(),
  userLanguageId: z.string(),
  conversationId: z.string().nullable(),
});

function extractText(parts: MessagePart[]): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return new Response("Invalid request", { status: 400 });

    const { messages, language: rawLanguage, userLanguageId, conversationId } = parsed.data;

    if (!isSupportedLanguage(rawLanguage)) {
      return new Response("Invalid language", { status: 400 });
    }
    const language: SupportedLanguage = rawLanguage;

    const userLanguage = await prisma.userLanguage.findUnique({
      where: { id: userLanguageId },
      select: { cefrLevel: true, userId: true },
    });
    if (!userLanguage) return new Response("Language not found", { status: 404 });

    // Ownership check
    if (userLanguage.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 403 });
    }

    const cefrLevel = (userLanguage.cefrLevel ?? "A1") as "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

    let convId = conversationId;
    let memorySnippets: string | null = null;

    if (!convId) {
      const conversation = await prisma.conversation.create({
        data: { userLanguageId },
      });
      convId = conversation.id;

      const firstUserMessage = messages.at(-1);
      const firstUserText = firstUserMessage
        ? extractText(firstUserMessage.parts as MessagePart[])
        : null;

      if (firstUserText) {
        memorySnippets = await retrieveRelevantMemory(
          firstUserText,
          userLanguageId,
          convId,
        ).catch((err) => {
          console.error("[chat/route] memory retrieval failed:", err);
          return null;
        });
      }
    }

    // System prompt contains NO user-derived content — pure persona + CEFR rules only
    const systemPrompt = buildConversationSystemPrompt({ language, cefrLevel });

    const lastUserMessage = messages.at(-1);
    const userText = lastUserMessage ? extractText(lastUserMessage.parts as MessagePart[]) : "";

    if (userText) {
      await prisma.message.create({
        data: { conversationId: convId, role: "user", content: userText },
      });
    }

    const conversationMessages = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: extractText(m.parts as MessagePart[]),
      }))
      .filter((m) => m.content.length > 0);

    // ── Memory injection — user role, not system role ──────────────────────
    // User-derived content (conversation summaries) must never be interpolated
    // into the system prompt. By prepending it as a user-role message, it
    // reaches the model naturally but cannot override system-level instructions.
    const modelMessages: { role: "user" | "assistant"; content: string }[] = [
      ...(memorySnippets ? [buildMemoryMessage(memorySnippets)] : []),
      ...conversationMessages,
    ];
    // ──────────────────────────────────────────────────────────────────────

    const result = streamText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: systemPrompt,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        // ── Persist assistant message ──────────────────────────────────────
        try {
          await prisma.message.create({
            data: { conversationId: convId, role: "assistant", content: text },
          });
        } catch (err) {
          console.error("[chat/route] failed to persist assistant message:", err);
        }

        // ── Update conversation title ──────────────────────────────────────
        try {
          await prisma.conversation.updateMany({
            where: { id: convId, title: null },
            data: {
              title: text.slice(0, 60).trim(),
              updatedAt: new Date(),
            },
          });
        } catch (err) {
          console.error("[chat/route] failed to update conversation title:", err);
        }

        // ── Background jobs — all void, never block the stream ─────────────
        void embedConversation(convId).catch((err) => {
          console.error("[chat/route] embedding failed:", err);
        });

        if (userText && text) {
          void extractAndSaveVocabulary({
            userMessage: userText,
            aiMessage: text,
            language,
            userLanguageId,
            conversationId: convId,
          }).catch((err) => {
            console.error("[chat/route] vocabulary extraction failed:", err);
          });

          void extractAndSaveGrammar({
            userMessage: userText,
            aiMessage: text,
            language,
            userLanguageId,
            conversationId: convId,
          }).catch((err) => {
            console.error("[chat/route] grammar extraction failed:", err);
          });
        }
      },
    });

    const response = result.toUIMessageStreamResponse();
    response.headers.set("X-Conversation-Id", convId);
    return response;
  } catch (err) {
    console.error("[chat/route] Unexpected error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}