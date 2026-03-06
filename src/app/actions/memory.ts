"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

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

export async function deleteMemory(embeddingId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  // Verify ownership before deleting
  const embedding = await prisma.conversationEmbedding.findFirst({
    where: {
      id: embeddingId,
      conversation: {
        userLanguage: { userId: session.user.id },
      },
    },
  });

  if (!embedding) throw new Error("Memory not found");

  await prisma.conversationEmbedding.delete({ where: { id: embeddingId } });

  revalidatePath("/settings");
}