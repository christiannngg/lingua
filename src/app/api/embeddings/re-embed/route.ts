/**
 * POST /api/embeddings/re-embed
 *
 * Re-embeds one conversation (by conversationId) or all conversations.
 * Use after changing the embedding model or vector dimensions.
 *
 * Body (optional): { conversationId: string }
 * If no body, re-embeds all conversations with >= 2 messages.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { embedConversation } from "@/lib/embeddings";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new Response("Unauthorized", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { conversationId } = body as { conversationId?: string };

    if (conversationId) {
      // ── Ownership check — verify this conversation belongs to the session user ──
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userLanguage: { userId: session.user.id },
        },
        select: { id: true },
      });

      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
      // ─────────────────────────────────────────────────────────────────────────

      try {
        await embedConversation(conversationId);
      } catch (err) {
        console.error(`[re-embed] failed for conversation ${conversationId}:`, err);
        return NextResponse.json({ error: "Failed to re-embed conversation" }, { status: 500 });
      }
      return NextResponse.json({ reembedded: [conversationId] });
    }

    // Re-embed all conversations belonging to the session user with enough messages
    const conversations = await prisma.conversation.findMany({
      where: {
        messages: { some: {} },
        userLanguage: { userId: session.user.id },
      },
      select: {
        id: true,
        _count: { select: { messages: true } },
      },
    });

    const eligible = conversations.filter((c) => c._count.messages >= 2);
    const results: string[] = [];

    for (const conv of eligible) {
      await embedConversation(conv.id).catch((err) => {
        console.error(`[re-embed] failed for ${conv.id}:`, err);
      });
      results.push(conv.id);
    }

    return NextResponse.json({ reembedded: results, total: results.length });
  } catch (err) {
    console.error("[re-embed] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}