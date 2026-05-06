"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { schedule, createNewCard } from "@/lib/fsrs/fsrs";
import { CardState, Rating } from "@/lib/fsrs/types";
import { isMasteredState, isValidRating, toCardSchedule } from "@/lib/fsrs/schedule-helpers";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ReviewCard = {
  id: string;
  word: string;
  lemma: string;
  translation: string;
  partOfSpeech: string | null;
  exampleSentence: string | null;
  // FSRS fields — needed client-side for optimistic display (reps, state label)
  state: string;
  reps: number;
  lapses: number;
  nextReview: Date | null;
};

export type ReviewQueue = {
  cards: ReviewCard[];
  language: string;
  cefrLevel: string;
  userLanguageId: string;
};

export type SubmitReviewResult = {
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
} | {
  success: false;
  error: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Public Server Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all cards due for review today for the given userLanguage.
 *
 * A card is due if:
 *   - state = "NEW" (never reviewed), OR
 *   - nextReview <= now (scheduled review date has arrived)
 *
 * Ordered by nextReview ASC so the most overdue cards come first.
 * New cards (nextReview = null) are placed at the end via NULLS LAST.
 */
export async function getReviewQueue(
  userLanguageId: string
): Promise<ReviewQueue> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  // Confirm ownership
  const userLanguage = await prisma.userLanguage.findUnique({
    where: { id: userLanguageId },
    select: { userId: true, language: true, cefrLevel: true },
  });

  if (!userLanguage || userLanguage.userId !== session.user.id) {
    throw new Error("Language not found");
  }

  const now = new Date();

  const items = await prisma.vocabularyItem.findMany({
    where: {
      userLanguageId,
      OR: [
        { state: CardState.New },
        { nextReview: { lte: now } },
      ],
    },
    orderBy: [
      // Most overdue first; nulls (New cards) at the end
      { nextReview: "asc" },
    ],
    select: {
      id: true,
      word: true,
      lemma: true,
      translation: true,
      partOfSpeech: true,
      exampleSentence: true,
      state: true,
      reps: true,
      lapses: true,
      nextReview: true,
    },
  });

  return {
    cards: items,
    language: userLanguage.language,
    cefrLevel: userLanguage.cefrLevel,
    userLanguageId,
  };
}

/**
 * Process a single card review:
 *   1. Read current FSRS state from DB
 *   2. Run schedule(card, rating)
 *   3. Write updated state back to DB
 *   4. Return the updated card fields to the client
 *
 * The client does NOT need to wait for this to advance the UI —
 * it can optimistically move to the next card immediately.
 * The return value is used to keep local state accurate if needed.
 */
export async function submitReview(
  vocabularyItemId: string,
  rating: Rating
): Promise<SubmitReviewResult> {
  
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthenticated");

    if (!isValidRating(rating)) {
      return { success: false, error: "Invalid rating value" };
    }

    // Fetch full FSRS state — we need all fields to run schedule()
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
      return { success: false, error: "Vocabulary item not found" };
    }

    // Ownership check — ensure this item belongs to the session user
    if (item.userLanguage.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Run the FSRS algorithm
    const cardSchedule = toCardSchedule(item);
    const now = new Date();
    const { card: updatedSchedule } = schedule(cardSchedule, rating, now);

    const wasAlreadyMastered = isMasteredState(item.state, item.reps);
    const isNowMastered = isMasteredState(updatedSchedule.state, updatedSchedule.reps);
    const justBecameMastered = !wasAlreadyMastered && isNowMastered;

    // Persist the updated FSRS state
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
    console.error("[submitReview] Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get the count of cards due for review today — used by the nav badge
 * and the review landing screen without loading the full queue.
 */
export async function getReviewCount(userLanguageId: string): Promise<number> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const now = new Date();

  return prisma.vocabularyItem.count({
    where: {
      userLanguageId,
      userLanguage: { userId: session.user.id },
      OR: [
        { state: CardState.New },
        { nextReview: { lte: now } },
      ],
    },
  });
}