"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export type MemoryActionResult = { success: true } | { success: false; error: string };

// ── Read actions (called from Server Components — throwing is fine) ──────────

export async function getMemories() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const embeddings = await prisma.conversationEmbedding.findMany({
    where: {
      conversation: {
        userLanguage: { userId: session.user.id },
      },
    },
    select: {
      id: true,
      summary: true,
      createdAt: true,
      conversation: {
        select: {
          title: true,
          userLanguage: {
            select: { language: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return embeddings.map((e) => ({
    id: e.id,
    summary: e.summary,
    createdAt: e.createdAt,
    conversationTitle: e.conversation.title,
    language: e.conversation.userLanguage.language,
  }));
}

// ── Mutating actions (called from client interactions — return result) ────────

export async function deleteMemory(embeddingId: string): Promise<MemoryActionResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Unauthenticated" };

    // Verify ownership before deleting
    const embedding = await prisma.conversationEmbedding.findFirst({
      where: {
        id: embeddingId,
        conversation: {
          userLanguage: { userId: session.user.id },
        },
      },
    });

    if (!embedding) return { success: false, error: "Memory not found" };

    await prisma.conversationEmbedding.delete({ where: { id: embeddingId } });

    revalidatePath("/settings");

    return { success: true };
  } catch (err) {
    console.error("[deleteMemory] Error:", err);
    return { success: false, error: "Failed to delete memory" };
  }
}