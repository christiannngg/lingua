import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { buildConversationSystemPrompt, buildMemoryMessage, buildGreeting } from "@/lib/ai/conversation-prompt";
import { extractAndSaveVocabulary } from "@/lib/ai/extract-vocabulary";
import { extractAndSaveGrammar } from "@/lib/ai/extract-grammar";
import { embedConversation } from "@/lib/embeddings";
import { retrieveRelevantMemory } from "@/lib/ai/retrieve-memory";
import { isSupportedLanguage, type SupportedLanguage } from "@/lib/languages.config";
import { chatLimiter } from "@/ratelimit";

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

    // ── Rate limiting ──────────────────────────────────────────────────────
    const { success, limit, remaining, reset } = await chatLimiter.limit(session.user.id);
    if (!success) {
      return new Response("Too many requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      });
    }
    // ──────────────────────────────────────────────────────────────────────

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

    if (userLanguage.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 403 });
    }

    const cefrLevel = (userLanguage.cefrLevel ?? "A1") as "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    const isNewConversation = !conversationId;
    let convId = conversationId;
    let memorySnippets: string | null = null;

    

    if (!convId) {
      const conversation = await prisma.conversation.create({
        data: { userLanguageId },
      });
      convId = conversation.id;

      const greetingText = buildGreeting(language);
      await prisma.message.create({
        data: { conversationId: convId, role: "assistant", content: greetingText },
      });

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
    
    const modelMessages: { role: "user" | "assistant"; content: string }[] = [
      ...(memorySnippets ? [buildMemoryMessage(memorySnippets)] : []),
      ...(isNewConversation ? [{ role: "assistant" as const, content: buildGreeting(language) }] : []),
      ...conversationMessages,
    ];


    const result = streamText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: systemPrompt,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        try {
          await prisma.message.create({
            data: { conversationId: convId, role: "assistant", content: text },
          });
        } catch (err) {
          console.error("[chat/route] failed to persist assistant message:", err);
        }

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