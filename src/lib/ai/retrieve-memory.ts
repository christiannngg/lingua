/**
 * retrieve-memory.ts
 *
 * Retrieves the most semantically relevant past conversation summaries
 * for a given user, using pgvector cosine similarity.
 *
 * Used on new conversation start to inject memory into the system prompt.
 */

import { prisma } from "@/lib/db/prisma";
import { embedText } from "@/lib/ai/embed";

const TOP_K = 3;
const SIMILARITY_THRESHOLD = 0.5;

interface MemoryRow {
  summary: string;
  similarity: number;
}

/**
 * Given the user's first message and their userLanguageId,
 * returns a formatted memory block string ready for system prompt injection.
 * Returns null if no relevant memories are found.
 */
export async function retrieveRelevantMemory(
  firstUserMessage: string,
  userLanguageId: string,
  currentConversationId: string,
): Promise<string | null> {
  // Embed the user's first message as the query vector
  const queryEmbedding = await embedText(firstUserMessage, "query");
  const queryLiteral = `[${queryEmbedding.join(",")}]`;

  // pgvector cosine similarity: 1 - cosine_distance
  // <=> is the cosine distance operator in pgvector
  const results = await prisma.$queryRaw<MemoryRow[]>`
    SELECT
      ce.summary,
      1 - (ce.embedding <=> ${queryLiteral}::vector(512)) AS similarity
    FROM conversation_embeddings ce
    INNER JOIN conversations c ON c.id = ce."conversationId"
    WHERE
      c."userLanguageId" = ${userLanguageId}
      AND ce."conversationId" != ${currentConversationId}
    ORDER BY ce.embedding <=> ${queryLiteral}::vector(512)
    LIMIT ${TOP_K}
  `;

  const relevant = results.filter((r) => r.similarity >= SIMILARITY_THRESHOLD);

  if (relevant.length === 0) return null;

  // Format into a readable memory block for the system prompt
  const memoriesText = relevant
    .map((r, i) => `Memory ${i + 1}: ${r.summary}`)
    .join("\n\n");

  return memoriesText;
}