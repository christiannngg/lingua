"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type ConversationActionResult = { success: true } | { success: false; error: string };

// Default page size — enough for a full sidebar without over-fetching
const CONVERSATIONS_PAGE_SIZE = 20;

export type ConversationPage = {
  conversations: {
    id: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
    messages: { content: string; role: string }[];
  }[];
  // Passed back to the next call as `cursor` to fetch the next page.
  // null means there are no more pages.
  nextCursor: string | null;
};

// Read actions (called from Server Components — throwing is fine)

/**
 * Fetches a page of conversations for the given userLanguage, ordered by
 * updatedAt DESC. Pass the `nextCursor` from the previous page to advance.
 */
export async function getConversations(
  userLanguageId: string,
  cursor?: string,
): Promise<ConversationPage> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  // Fetch one extra row to determine whether a next page exists without
  // a separate COUNT query
  const limit = CONVERSATIONS_PAGE_SIZE + 1;

  const rows = await prisma.conversation.findMany({
    where: { userLanguageId, userLanguage: { userId: session.user.id } },
    orderBy: { updatedAt: "desc" },
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1, // skip the cursor row itself
        }
      : {}),
    take: limit,
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

  const hasNextPage = rows.length === limit;
  const conversations = hasNextPage ? rows.slice(0, CONVERSATIONS_PAGE_SIZE) : rows;
  const nextCursor = hasNextPage ? (conversations[CONVERSATIONS_PAGE_SIZE - 1]?.id ?? null) : null;

  return { conversations, nextCursor };
}

export async function getConversationMessages(conversationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

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

// Mutating actions (called from client interactions — return result)

export async function deleteConversation(
  conversationId: string,
): Promise<ConversationActionResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Unauthenticated" };

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

export async function getConversationsByLanguage(
  language: string,
  cursor?: string,
): Promise<ConversationPage> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const userLanguage = await prisma.userLanguage.findUnique({
    where: { userId_language: { userId: session.user.id, language } },
    select: { id: true },
  });

  if (!userLanguage) return { conversations: [], nextCursor: null };

  return getConversations(userLanguage.id, cursor);
}