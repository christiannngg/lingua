"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CardState } from "@/lib/fsrs/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

// Raw vocabulary item as returned from Prisma — used internally and exported
// so the Client Component can type its props without re-importing Prisma.
export type VocabularyItemRow = {
  id: string;
  word: string;
  translation: string;
  partOfSpeech: string | null;
  exampleSentence: string | null;
  state: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  nextReview: Date | null;
  lastReview: Date | null;
  createdAt: Date;
  sourceConversation: {
    id: string;
    title: string | null;
    createdAt: Date;
  } | null;
};

// Display-level mastery label — derived from state + reps, never stored in DB.
export type MasteryLabel = "New" | "Learning" | "Review" | "Relearning" | "Mastered";

export type VocabularyItemWithMastery = VocabularyItemRow & {
  masteryLabel: MasteryLabel;
};

// Counts shown in the tab headers.
export type VocabularyCounts = {
  total: number;
  new: number;
  learning: number;
  review: number;
  relearning: number;
  mastered: number;
};

// The full shape returned to the page and Client Component.
export type VocabularyDashboardData = {
  items: VocabularyItemWithMastery[];
  counts: VocabularyCounts;
  language: string;
  cefrLevel: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Reps threshold above which a REVIEW card is considered "Mastered" in the UI.
const MASTERED_REPS_THRESHOLD = 5;

function deriveMasteryLabel(state: string, reps: number): MasteryLabel {
  if (state === CardState.Review && reps >= MASTERED_REPS_THRESHOLD) {
    return "Mastered";
  }
  switch (state) {
    case CardState.New:        return "New";
    case CardState.Learning:   return "Learning";
    case CardState.Review:     return "Review";
    case CardState.Relearning: return "Relearning";
    default:                   return "New"; // safe fallback for unexpected values
  }
}

function deriveCounts(items: VocabularyItemWithMastery[]): VocabularyCounts {
  const counts: VocabularyCounts = {
    total: items.length,
    new: 0,
    learning: 0,
    review: 0,
    relearning: 0,
    mastered: 0,
  };

  for (const item of items) {
    switch (item.masteryLabel) {
      case "New":        counts.new++;        break;
      case "Learning":   counts.learning++;   break;
      case "Review":     counts.review++;     break;
      case "Relearning": counts.relearning++; break;
      case "Mastered":   counts.mastered++;   break;
    }
  }

  return counts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Server Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all vocabulary items for the given language, grouped with mastery labels.
 *
 * The caller (page.tsx) is responsible for:
 *   1. Resolving the ?lang= param to a valid userLanguageId
 *   2. Verifying the userLanguage belongs to the session user
 *
 * This action trusts the userLanguageId it receives and focuses only on
 * fetching and shaping the data.
 */
export async function getVocabularyDashboard(
  userLanguageId: string
): Promise<VocabularyDashboardData> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  // Fetch the UserLanguage record to confirm ownership + get language/cefrLevel
  const userLanguage = await prisma.userLanguage.findUnique({
    where: { id: userLanguageId },
    select: { userId: true, language: true, cefrLevel: true },
  });

  if (!userLanguage || userLanguage.userId !== session.user.id) {
    throw new Error("Language not found");
  }

  // Single query — fetch all vocabulary items with their source conversation
  const rawItems = await prisma.vocabularyItem.findMany({
    where: { userLanguageId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      word: true,
      translation: true,
      partOfSpeech: true,
      exampleSentence: true,
      state: true,
      stability: true,
      difficulty: true,
      reps: true,
      lapses: true,
      nextReview: true,
      lastReview: true,
      createdAt: true,
      sourceConversation: {
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      },
    },
  });

  // Derive mastery label for each item (pure, no extra DB calls)
  const items: VocabularyItemWithMastery[] = rawItems.map((item) => ({
    ...item,
    masteryLabel: deriveMasteryLabel(item.state, item.reps),
  }));

  return {
    items,
    counts: deriveCounts(items),
    language: userLanguage.language,
    cefrLevel: userLanguage.cefrLevel,
  };
}

/**
 * Resolve a language code (e.g. "es") to its UserLanguage record for the
 * current session user. Returns null if not found or not owned by the user.
 *
 * Used by page.tsx to validate the ?lang= param before calling
 * getVocabularyDashboard.
 */
export async function getUserLanguageByCode(
  language: string
): Promise<{ id: string; language: string; cefrLevel: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  return prisma.userLanguage.findUnique({
    where: {
      userId_language: { userId: session.user.id, language },
    },
    select: { id: true, language: true, cefrLevel: true },
  });
}