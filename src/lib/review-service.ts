import { prisma } from "@/lib/db/prisma";
import { schedule } from "@/lib/fsrs/fsrs";
import { isMasteredState, isValidRating, toCardSchedule } from "@/lib/fsrs/schedule-helpers";


export type ReviewResultSuccess = {
  success: true;
  updatedCard: {
    id: string;
    state: string;
    stability: number;
    difficulty: number;
    reps: number;
    lapses: number;
    nextReview: Date | null;
    lastReview: Date | null;
  };
};

export type ReviewResultFailure = {
  success: false;
  error: string;
  status: 400 | 403 | 404 | 500;
};

export type ReviewResult = ReviewResultSuccess | ReviewResultFailure;


// Validates, schedules, and persists a single FSRS card review.
export async function processReview(
  vocabularyItemId: string,
  rating: unknown,
  userId: string,
): Promise<ReviewResult> {
  try {
    if (!isValidRating(rating)) {
      return { success: false, error: "Invalid rating value", status: 400 };
    }

    const item = await prisma.vocabularyItem.findUnique({
      where: { id: vocabularyItemId },
      select: {
        id: true,
        state: true,
        stability: true,
        difficulty: true,
        reps: true,
        lapses: true,
        lastReview: true,
        nextReview: true,
        userLanguage: {
          select: { userId: true },
        },
      },
    });

    if (!item) {
      return { success: false, error: "Vocabulary item not found", status: 404 };
    }

    if (item.userLanguage.userId !== userId) {
      return { success: false, error: "Unauthorized", status: 403 };
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
        id: true,
        state: true,
        stability: true,
        difficulty: true,
        reps: true,
        lapses: true,
        lastReview: true,
        nextReview: true,
      },
    });

    return { success: true, updatedCard: updated };
  } catch (err) {
    console.error("[processReview] Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred", status: 500 };
  }
}