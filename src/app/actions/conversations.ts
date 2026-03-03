"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getConversations(userLanguageId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  return prisma.conversation.findMany({
    where: { userLanguageId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { content: true, role: true },
      },
    },
  });
}

export async function getConversationMessages(conversationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteConversation(conversationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  // Verify the conversation belongs to this user before deleting
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userLanguage: { userId: session.user.id },
    },
  });

  if (!conversation) throw new Error("Conversation not found");

  await prisma.conversation.delete({ where: { id: conversationId } });
}