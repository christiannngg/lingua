/**
 * embeddings.ts
 *
 * Orchestrator for the conversation embedding pipeline.
 *
 * Flow:
 *   1. Fetch messages for the conversation
 *   2. Guard: skip if fewer than 2 messages (not worth embedding)
 *   3. Summarize with Claude Haiku
 *   4. Embed summary with Voyage AI
 *   5. Upsert into conversation_embeddings via raw SQL
 *      (Prisma can't write to Unsupported() vector columns via the standard client)
 */

import { prisma } from "@/lib/db/prisma";
import { summarizeConversation } from "@/lib/ai/summarize";
import { embedText } from "@/lib/ai/embed";

export async function embedConversation(conversationId: string): Promise<void> {
  // 1. Fetch messages
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });

  // 2. Guard: not worth embedding very short conversations
  if (messages.length < 2) {
    console.log(`[embeddings] skipping ${conversationId} — only ${messages.length} message(s)`);
    return;
  }

  // 3. Summarize
  const summary = await summarizeConversation(messages);

  // 4. Embed
  const embedding = await embedText(summary);

  // 5. Upsert via raw SQL — Prisma cannot write vector columns through the standard client
  const embeddingLiteral = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    INSERT INTO conversation_embeddings ("id", "conversationId", "summary", "embedding", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      ${conversationId},
      ${summary},
      ${embeddingLiteral}::vector(512),
      NOW(),
      NOW()
    )
    ON CONFLICT ("conversationId") DO UPDATE SET
      "summary"   = EXCLUDED."summary",
      "embedding" = EXCLUDED."embedding",
      "updatedAt" = NOW()
  `;

  console.log(`[embeddings] embedded conversation ${conversationId}`);
}