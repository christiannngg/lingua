import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { buildConversationSystemPrompt } from "@/lib/ai/conversation-prompt";

const anthropic = createAnthropic();

type MessagePart = { type: string; text?: string | undefined };

const RequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      parts: z.array(z.object({ type: z.string(), text: z.string().optional() })),
    }),
  ),
  language: z.enum(["es", "it"]),
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
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return new Response("Invalid request", { status: 400 });

  const { messages, language, userLanguageId, conversationId } = parsed.data;

  const userLanguage = await prisma.userLanguage.findUnique({
    where: { id: userLanguageId },
    select: { cefrLevel: true },
  });
  if (!userLanguage) return new Response("Language not found", { status: 404 });

  const cefrLevel = (userLanguage.cefrLevel ?? "A1") as "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

  const systemPrompt = buildConversationSystemPrompt({ language, cefrLevel });

  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    const conversation = await prisma.conversation.create({
      data: { userLanguageId },
    });
    convId = conversation.id;
  }

  // The last message in the array is the one just sent by the user
  const lastUserMessage = messages.at(-1);
  const userText = lastUserMessage ? extractText(lastUserMessage.parts as MessagePart[]) : "";

  // Persist the user message
  if (userText) {
    await prisma.message.create({
      data: { conversationId: convId, role: "user", content: userText },
    });
  }

  const modelMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: extractText(m.parts as MessagePart[]),
    }))
    .filter((m) => m.content.length > 0);

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: modelMessages,
    onFinish: async ({ text }) => {
      await prisma.message.create({
        data: { conversationId: convId, role: "assistant", content: text },
      });

      await prisma.conversation.updateMany({
        where: { id: convId, title: null },
        data: {
          title: text.slice(0, 60).trim(),
          updatedAt: new Date(),
        },
      });
    },
  });
  console.log("[chat/route] streaming result created, returning response");
  const response = result.toUIMessageStreamResponse();
  console.log("[chat/route] response headers:", Object.fromEntries(response.headers.entries()));
  response.headers.set("X-Conversation-Id", convId);
  return response;
}
