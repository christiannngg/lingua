"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateWeeklySummary } from "@/lib/ai/weekly-summary";
import { weeklySummaryLimiter } from "@/ratelimit";

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
  isLevelDown: boolean;
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
    const isLevelDown = prevNumeric !== null && numericLevel < prevNumeric;

    return {
      date: entry.takenAt.toISOString().slice(0, 10),
      cefrLevel: entry.cefrLevel,
      numericLevel,
      isLevelUp,
      isLevelDown
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

export async function getWeeklySummary(language: string, forceRefresh = false): Promise<WeeklySummaryResult | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  if (forceRefresh) {
    const { success } = await weeklySummaryLimiter.limit(session.user.id);
    if (!success) throw new Error("Rate limit exceeded. Try again later.");
  }

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

  if (!forceRefresh && cached && cached.generatedAt > sevenDaysAgo) {
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

export type WordOfTheDay = {
  id: string;
  word: string;
  translation: string;
  partOfSpeech: string | null;
  exampleSentence: string | null;
  stability: number;
  state: string;
};

export async function getWordOfTheDay(language: string): Promise<WordOfTheDay | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const userLanguage = await prisma.userLanguage.findUnique({
    where: {
      userId_language: { userId: session.user.id, language },
    },
    select: { id: true },
  });

  if (!userLanguage) return null;

  // Lowest stability = word the user knows least well.
  // Prefer items that have an example sentence.
  // Tiebreak: nextReview asc (most overdue first).
  const item = await prisma.vocabularyItem.findFirst({
    where: {
      userLanguageId: userLanguage.id,
      exampleSentence: { not: null },
    },
    orderBy: [{ stability: "asc" }, { nextReview: "asc" }],
    select: {
      id: true,
      word: true,
      translation: true,
      partOfSpeech: true,
      exampleSentence: true,
      stability: true,
      state: true,
    },
  });

  // Fallback: no example sentence requirement if nothing has one yet
  if (!item) {
    const fallback = await prisma.vocabularyItem.findFirst({
      where: { userLanguageId: userLanguage.id },
      orderBy: [{ stability: "asc" }, { nextReview: "asc" }],
      select: {
        id: true,
        word: true,
        translation: true,
        partOfSpeech: true,
        exampleSentence: true,
        stability: true,
        state: true,
      },
    });
    return fallback;
  }

  return item;
}
// ── REPLACE getActivityHeatmap in src/app/actions/progress.ts ────────────────

export type ActivityDay = {
  date: string;
  count: number;
  isFuture: boolean; // true only for dates after today
  isBeforeSignup: boolean; // true for dates before the user created their account
};
export async function getActivityHeatmap(language: string): Promise<ActivityDay[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const userLanguage = await prisma.userLanguage.findUnique({
    where: { userId_language: { userId: session.user.id, language } },
    select: { id: true, createdAt: true },
  });

  if (!userLanguage) return [];

  const now = new Date();
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const yearEnd = new Date(Date.UTC(now.getUTCFullYear(), 11, 31));

  // Use language enrollment date, not account creation date.
  // A user may have signed up months before adding this language.
  const activeStart = userLanguage.createdAt > yearStart ? userLanguage.createdAt : yearStart;

  const conversations = await prisma.conversation.findMany({
    where: {
      userLanguageId: userLanguage.id,
      createdAt: { gte: activeStart },
    },
    select: { createdAt: true },
  });

  const countsByDate = new Map<string, number>();
  for (const c of conversations) {
    const date = c.createdAt.toISOString().slice(0, 10);
    countsByDate.set(date, (countsByDate.get(date) ?? 0) + 1);
  }

  const today = now.toISOString().slice(0, 10);
  const activeStartStr = activeStart.toISOString().slice(0, 10);

  const days: ActivityDay[] = [];
  const cursor = new Date(yearStart);
  while (cursor <= yearEnd) {
    const date = cursor.toISOString().slice(0, 10);
    days.push({
      date,
      count: countsByDate.get(date) ?? 0,
      isFuture: date > today,
      isBeforeSignup: date < activeStartStr,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

// mastery progress

export type MasteryProgress = {
  newCount: number;
  learningCount: number;
  reviewCount: number;
  masteredCount: number;
  total: number;
  // Words in Learning/Review state needed to reach the next mastery milestone
  wordsUntilNextMilestone: number;
  // The next milestone total mastered count (nearest multiple of 25)
  nextMilestone: number;
};

export async function getMasteryProgress(language: string): Promise<MasteryProgress | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const userLanguage = await prisma.userLanguage.findUnique({
    where: { userId_language: { userId: session.user.id, language } },
    select: { id: true },
  });

  if (!userLanguage) return null;

  const items = await prisma.vocabularyItem.findMany({
    where: { userLanguageId: userLanguage.id },
    select: { state: true, reps: true },
  });

  let newCount = 0;
  let learningCount = 0;
  let reviewCount = 0;
  let masteredCount = 0;

  for (const item of items) {
    if (item.state === "REVIEW" && item.reps >= MASTERED_REPS_THRESHOLD) {
      masteredCount++;
    } else if (item.state === "NEW") {
      newCount++;
    } else if (item.state === "LEARNING" || item.state === "RELEARNING") {
      learningCount++;
    } else {
      reviewCount++;
    }
  }

  // Next milestone = nearest multiple of 25 above current mastered count
  const nextMilestone = Math.max(25, Math.ceil((masteredCount + 1) / 25) * 25);
  const wordsUntilNextMilestone = nextMilestone - masteredCount;

  return {
    newCount,
    learningCount,
    reviewCount,
    masteredCount,
    total: items.length,
    wordsUntilNextMilestone,
    nextMilestone,
  };
}

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
};

export async function getGlobalStreak(): Promise<StreakData> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { currentStreak: 0, longestStreak: 0 };

  // Get all userLanguage IDs for this user
  const userLanguages = await prisma.userLanguage.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (userLanguages.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const userLanguageIds = userLanguages.map((ul) => ul.id);

  // Fetch all conversation dates across all languages, past 365 days
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 365);

  const conversations = await prisma.conversation.findMany({
    where: {
      userLanguageId: { in: userLanguageIds },
      createdAt: { gte: since },
    },
    select: { createdAt: true },
  });

  // Build a Set of active date strings in UTC ("2026-05-04")
  const activeDates = new Set<string>();
  for (const c of conversations) {
    activeDates.add(c.createdAt.toISOString().slice(0, 10));
  }

  // Walk backwards from today to compute currentStreak
  const today = new Date();
  let currentStreak = 0;
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (activeDates.has(dateStr)) {
      currentStreak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      // Allow a 1-day grace: if today has no activity yet, check yesterday
      // before breaking — so a streak doesn't reset at midnight
      if (currentStreak === 0) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        const yesterdayStr = cursor.toISOString().slice(0, 10);
        if (activeDates.has(yesterdayStr)) {
          // yesterday was active — streak is still alive, count from yesterday
          currentStreak++;
          cursor.setUTCDate(cursor.getUTCDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  // Compute longestStreak by scanning all active dates in order
  const sortedDates = [...activeDates].sort();
  let longestStreak = 0;
  let runLength = 0;
  let prevDate: string | null = null;

  for (const dateStr of sortedDates) {
    if (prevDate === null) {
      runLength = 1;
    } else {
      const prev = new Date(prevDate);
      const curr = new Date(dateStr);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        runLength++;
      } else {
        runLength = 1;
      }
    }
    if (runLength > longestStreak) longestStreak = runLength;
    prevDate = dateStr;
  }

  return { currentStreak, longestStreak };
}