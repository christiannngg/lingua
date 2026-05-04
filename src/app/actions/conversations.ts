"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type ConversationActionResult = { success: true } | { success: false; error: string };

// ── Read actions (called from Server Components — throwing is fine) ──────────

export async function getConversations(userLanguageId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  return prisma.conversation.findMany({
    where: { userLanguageId, userLanguage: { userId: session.user.id } },
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

  // Verify the conversation belongs to the session user before returning messages
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userLanguage: { userId: session.user.id },
    },
    select: { id: true },
  });

  if (!conversation) return [];

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}

// ── Mutating actions (called from client interactions — return result) ────────

export async function deleteConversation(
  conversationId: string,
): Promise<ConversationActionResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Unauthenticated" };

    // Verify the conversation belongs to this user before deleting
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userLanguage: { userId: session.user.id },
      },
    });

    if (!conversation) return { success: false, error: "Conversation not found" };

    await prisma.conversation.delete({ where: { id: conversationId } });

    return { success: true };
  } catch (err) {
    console.error("[deleteConversation] Error:", err);
    return { success: false, error: "Failed to delete conversation" };
  }
}

export async function getConversationsByLanguage(language: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const userLanguage = await prisma.userLanguage.findUnique({
    where: { userId_language: { userId: session.user.id, language } },
    select: { id: true },
  });

  if (!userLanguage) return [];

  return getConversations(userLanguage.id);
}