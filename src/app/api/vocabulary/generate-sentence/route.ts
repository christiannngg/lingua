import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { buildSentenceGenerationPrompt } from "@/lib/ai/sentence-generation";

const anthropic = new Anthropic();

// ─────────────────────────────────────────────────────────────────────────────
// Request validation
// ─────────────────────────────────────────────────────────────────────────────

const RequestSchema = z.object({
  vocabularyItemId: z.string().min(1),
});

// ─────────────────────────────────────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // ── Validate request ────────────────────────────────────────────────────
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { vocabularyItemId } = parsed.data;

    // ── Fetch vocabulary item + context ─────────────────────────────────────
    const item = await prisma.vocabularyItem.findUnique({
      where: { id: vocabularyItemId },
      select: {
        id: true,
        word: true,
        translation: true,
        partOfSpeech: true,
        exampleSentence: true,
        userLanguage: {
          select: {
            userId: true,
            language: true,
            cefrLevel: true,
            // Pull recent conversation titles as a proxy for user interests
            conversations: {
              select: { title: true },
              orderBy: { updatedAt: "desc" },
              take: 5,
              where: { title: { not: null } },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Vocabulary item not found" }, { status: 404 });
    }

    // ── Ownership check ─────────────────────────────────────────────────────
    if (item.userLanguage.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ── Build prompt ────────────────────────────────────────────────────────
    const conversationTopics = item.userLanguage.conversations
      .map((c) => c.title)
      .filter((t): t is string => t !== null);

    const prompt = buildSentenceGenerationPrompt({
      word: item.word,
      translation: item.translation,
      partOfSpeech: item.partOfSpeech,
      language: item.userLanguage.language,
      cefrLevel: item.userLanguage.cefrLevel,
      conversationTopics,
      previousSentence: item.exampleSentence,
    });

    // ── Call Claude Haiku ───────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    // ── Extract sentence from response ──────────────────────────────────────
    const firstBlock = response.content[0];
    if (!firstBlock || firstBlock.type !== "text") {
      return NextResponse.json({ error: "No sentence generated" }, { status: 500 });
    }

    const sentence = firstBlock.text.trim();

    if (!sentence) {
      return NextResponse.json({ error: "Empty sentence generated" }, { status: 500 });
    }

    return NextResponse.json({ sentence });

  } catch (err) {
    // Log server-side but return a generic error — client will fall back
    // to the stored example sentence silently
    console.error("[generate-sentence] Unexpected error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}