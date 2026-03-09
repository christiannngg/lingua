"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const CEFR_TO_NUMERIC: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

export type CefrDataPoint = {
  date: string;
  cefrLevel: string;
  numericLevel: number;
  isLevelUp: boolean;
};

export type VocabGrowthPoint = {
  week: string;
  learning: number;
  mastered: number;
};

// Mirrors the MASTERED_REPS_THRESHOLD in vocabulary.ts
const MASTERED_REPS_THRESHOLD = 5;

function isMastered(state: string, reps: number): boolean {
  return state === "REVIEW" && reps >= MASTERED_REPS_THRESHOLD;
}

// Returns the ISO date string for the Monday of the week containing `date`
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day; // adjust so Monday = start
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export async function getCefrHistory(language: string): Promise<CefrDataPoint[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const userLanguage = await prisma.userLanguage.findUnique({
    where: {
      userId_language: { userId: session.user.id, language },
    },
    include: {
      assessmentHistory: {
        orderBy: { takenAt: "asc" },
      },
    },
  });

  if (!userLanguage || userLanguage.assessmentHistory.length === 0) return [];

  const points: CefrDataPoint[] = userLanguage.assessmentHistory.map((entry, index, arr) => {
    const numericLevel = CEFR_TO_NUMERIC[entry.cefrLevel] ?? 1;
    const prev = index > 0 ? arr[index - 1] : null;
    const prevNumeric = prev ? (CEFR_TO_NUMERIC[prev.cefrLevel] ?? 1) : null;
    const isLevelUp = prevNumeric !== null && numericLevel > prevNumeric;

    return {
      date: entry.takenAt.toISOString().slice(0, 10),
      cefrLevel: entry.cefrLevel,
      numericLevel,
      isLevelUp,
    };
  });

  return points;
}

export async function getVocabularyGrowth(language: string): Promise<VocabGrowthPoint[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const userLanguage = await prisma.userLanguage.findUnique({
    where: {
      userId_language: { userId: session.user.id, language },
    },
    select: { id: true },
  });

  if (!userLanguage) return [];

  const items = await prisma.vocabularyItem.findMany({
    where: { userLanguageId: userLanguage.id },
    select: { createdAt: true, state: true, reps: true },
    orderBy: { createdAt: "asc" },
  });

  if (items.length === 0) return [];

  // Bucket items by week start date
  const weekMap = new Map<string, { learning: number; mastered: number }>();

  for (const item of items) {
    const week = getWeekStart(item.createdAt);
    if (!weekMap.has(week)) {
      weekMap.set(week, { learning: 0, mastered: 0 });
    }
    const bucket = weekMap.get(week)!;
    if (isMastered(item.state, item.reps)) {
      bucket.mastered++;
    } else {
      bucket.learning++;
    }
  }

  // Sort weeks ascending and compute cumulative totals
  const sortedWeeks = [...weekMap.keys()].sort();

  let cumulativeLearning = 0;
  let cumulativeMastered = 0;

  return sortedWeeks.map((week) => {
    const bucket = weekMap.get(week)!;
    cumulativeLearning += bucket.learning;
    cumulativeMastered += bucket.mastered;

    return {
      week,
      learning: cumulativeLearning,
      mastered: cumulativeMastered,
    };
  });
}