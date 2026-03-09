"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateWeeklySummary } from "@/lib/ai/weekly-summary";

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

export type GrammarErrorDetail = {
  userSentence: string;
  correction: string;
  explanation: string;
  date: string;
};

export type GrammarConceptRow = {
  conceptId: string;
  name: string;
  description: string;
  errorCount: number;
  recentScore: number;
  lastSeenAt: string;
  isMastered: boolean;
  recentErrors: GrammarErrorDetail[];
};

export type WeeklySummaryResult = {
  content: string;
  generatedAt: string;
};

// Mirrors the MASTERED_REPS_THRESHOLD in vocabulary.ts
const MASTERED_REPS_THRESHOLD = 5;

// Concepts with no errors in the last 30 days are considered mastered
const MASTERED_DAYS_THRESHOLD = 30;

// Exponential decay half-life in days for recency weighting
const DECAY_HALF_LIFE = 14;

function isMastered(state: string, reps: number): boolean {
  return state === "REVIEW" && reps >= MASTERED_REPS_THRESHOLD;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function computeDecayScore(errors: { createdAt: Date }[], now: Date): number {
  return errors.reduce((score, error) => {
    const daysSince = (now.getTime() - error.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return score + Math.exp(-daysSince / DECAY_HALF_LIFE);
  }, 0);
}

// ── All read actions — throwing is fine, called from Server Components ────────

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

export async function getGrammarHeatmap(language: string): Promise<GrammarConceptRow[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const userLanguage = await prisma.userLanguage.findUnique({
    where: {
      userId_language: { userId: session.user.id, language },
    },
    select: { id: true },
  });

  if (!userLanguage) return [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - MASTERED_DAYS_THRESHOLD * 24 * 60 * 60 * 1000);

  const masteries = await prisma.userGrammarMastery.findMany({
    where: { userLanguageId: userLanguage.id },
    include: { grammarConcept: true },
  });

  if (masteries.length === 0) return [];

  const recentErrors = await prisma.grammarError.findMany({
    where: {
      userLanguageId: userLanguage.id,
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: "desc" },
    select: {
      grammarConceptId: true,
      userSentence: true,
      correction: true,
      explanation: true,
      createdAt: true,
    },
  });

  const errorsByConceptId = new Map<string, typeof recentErrors>();
  for (const error of recentErrors) {
    if (!errorsByConceptId.has(error.grammarConceptId)) {
      errorsByConceptId.set(error.grammarConceptId, []);
    }
    errorsByConceptId.get(error.grammarConceptId)!.push(error);
  }

  const rows: GrammarConceptRow[] = masteries.map((mastery) => {
    const conceptErrors = errorsByConceptId.get(mastery.grammarConceptId) ?? [];
    const recentScore = computeDecayScore(conceptErrors, now);
    const isMasteredConcept = mastery.lastSeenAt < thirtyDaysAgo;

    return {
      conceptId: mastery.grammarConceptId,
      name: mastery.grammarConcept.name,
      description: mastery.grammarConcept.description,
      errorCount: mastery.errorCount,
      recentScore,
      lastSeenAt: mastery.lastSeenAt.toISOString().slice(0, 10),
      isMastered: isMasteredConcept,
      recentErrors: conceptErrors.slice(0, 5).map((e) => ({
        userSentence: e.userSentence,
        correction: e.correction,
        explanation: e.explanation,
        date: e.createdAt.toISOString().slice(0, 10),
      })),
    };
  });

  const active = rows.filter((r) => !r.isMastered).sort((a, b) => b.recentScore - a.recentScore);
  const mastered = rows.filter((r) => r.isMastered).sort((a, b) => b.errorCount - a.errorCount);

  return [...active, ...mastered];
}

export async function getWeeklySummary(language: string): Promise<WeeklySummaryResult | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const userLanguage = await prisma.userLanguage.findUnique({
    where: {
      userId_language: { userId: session.user.id, language },
    },
    select: { id: true, cefrLevel: true },
  });

  if (!userLanguage) return null;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Return cached summary if it exists and is less than 7 days old
  const cached = await prisma.weeklySummary.findUnique({
    where: { userLanguageId: userLanguage.id },
  });

  if (cached && cached.generatedAt > sevenDaysAgo) {
    return {
      content: cached.content,
      generatedAt: cached.generatedAt.toISOString().slice(0, 10),
    };
  }

  // Gather this week's stats
  const [wordsLearned, conversationsHad, grammarErrors, levelChange] = await Promise.all([
    prisma.vocabularyItem.count({
      where: {
        userLanguageId: userLanguage.id,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.conversation.count({
      where: {
        userLanguageId: userLanguage.id,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.grammarError.count({
      where: {
        userLanguageId: userLanguage.id,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.assessmentHistory.findFirst({
      where: {
        userLanguageId: userLanguage.id,
        takenAt: { gte: sevenDaysAgo },
      },
      orderBy: { takenAt: "desc" },
      select: { cefrLevel: true },
    }),
  ]);

  // The AI call is the only thing that can fail here in a non-DB way.
  // If it throws, return null so the UI shows an empty/retry state rather
  // than crashing the entire progress page.
  let content: string;
  try {
    content = await generateWeeklySummary({
      language,
      cefrLevel: userLanguage.cefrLevel,
      wordsLearned,
      conversationsHad,
      grammarErrorsThisWeek: grammarErrors,
      levelChangedTo: levelChange?.cefrLevel ?? null,
    });
  } catch (err) {
    console.error("[getWeeklySummary] AI generation failed:", err);
    return null;
  }

  // Upsert cache — replace any existing summary for this user language
  try {
    await prisma.weeklySummary.upsert({
      where: { userLanguageId: userLanguage.id },
      create: { userLanguageId: userLanguage.id, content },
      update: { content, generatedAt: new Date() },
    });
  } catch (err) {
    // Cache write failure is non-critical — still return the generated content
    console.error("[getWeeklySummary] Cache write failed:", err);
  }

  return {
    content,
    generatedAt: new Date().toISOString().slice(0, 10),
  };
}
