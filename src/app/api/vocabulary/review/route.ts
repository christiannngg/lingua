import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { schedule } from "@/lib/fsrs/fsrs";
import { isMasteredState, isValidRating, toCardSchedule } from "@/lib/fsrs/schedule-helpers";


export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const body = await req.json() as { vocabularyItemId?: string; rating?: unknown };
    const { vocabularyItemId, rating } = body;

    if (!vocabularyItemId || typeof vocabularyItemId !== "string") {
      return NextResponse.json({ error: "Missing vocabularyItemId" }, { status: 400 });
    }

    if (!isValidRating(rating)) {
      return NextResponse.json({ error: "Invalid rating value" }, { status: 400 });
    }

    const item = await prisma.vocabularyItem.findUnique({
      where: { id: vocabularyItemId },
      select: {
        id: true, state: true, stability: true, difficulty: true,
        reps: true, lapses: true, lastReview: true, nextReview: true,
        userLanguage: { select: { userId: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Vocabulary item not found" }, { status: 404 });
    }

    if (item.userLanguage.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const cardSchedule = toCardSchedule(item);
    const now = new Date();
    const { card: updatedSchedule } = schedule(cardSchedule, rating, now);

    const wasAlreadyMastered = isMasteredState(item.state, item.reps);
    const isNowMastered = isMasteredState(updatedSchedule.state, updatedSchedule.reps);
    const justBecameMastered = !wasAlreadyMastered && isNowMastered;

    const updated = await prisma.vocabularyItem.update({
      where: { id: vocabularyItemId },
      data: {
        state:      updatedSchedule.state,
        stability:  updatedSchedule.stability,
        difficulty: updatedSchedule.difficulty,
        reps:       updatedSchedule.reps,
        lapses:     updatedSchedule.lapses,
        lastReview: updatedSchedule.lastReview,
        nextReview: updatedSchedule.nextReview,
        ...(justBecameMastered && { masteredAt: now }),
      },
      select: {
        id: true, state: true, stability: true, difficulty: true,
        reps: true, lapses: true, lastReview: true, nextReview: true,
      },
    });

    return NextResponse.json({ success: true, updatedCard: updated });
  } catch (err) {
    console.error("[POST /api/vocabulary/review] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}