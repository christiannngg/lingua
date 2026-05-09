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
const DORMANT_DAYS_THRESHOLD = 30;

// Exponential decay half-life in days for recency weighting
const DECAY_HALF_LIFE = 14;

// Fetch errors up to 4× the half-life back so computeDecayScore has a complete
// picture. e^(-56/14) = e^(-4) ≈ 1.8% — negligible contribution beyond this.
const DECAY_FETCH_WINDOW_DAYS = DECAY_HALF_LIFE * 4; // 56

// Hard ceiling on grammarError rows fetched to protect against runaway queries
const ERROR_FETCH_LIMIT = 500;

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

// All read actions — throwing is fine, called from Server Components

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
    select: { createdAt: true, masteredAt: true, state: true, reps: true },
    orderBy: { createdAt: "asc" },
  });

  if (items.length === 0) return [];

  // Build a unified set of all weeks that appear in either encounter or mastery dates.
  // Each week bucket tracks words encountered (learning) and words mastered (mastered)
  // that week — on separate timelines, so a word can appear in different weeks for each.
  const weekMap = new Map<string, { learning: number; mastered: number }>();

  function ensureBucket(week: string) {
    if (!weekMap.has(week)) {
      weekMap.set(week, { learning: 0, mastered: 0 });
    }
    return weekMap.get(week)!;
  }

  for (const item of items) {
    // Every word gets counted as "encountered" in its creation week, regardless of
    // current mastery state. This represents the raw vocabulary growth line.
    const encounterWeek = getWeekStart(item.createdAt);
    ensureBucket(encounterWeek).learning++;

    // If mastered, also record a mastery event in the week mastery was achieved.
    // masteredAt is the precise timestamp (or a lastReview-based estimate for
    // backfilled rows). Words without masteredAt are still in progress.
    if (item.masteredAt !== null) {
      const masteryWeek = getWeekStart(item.masteredAt);
      ensureBucket(masteryWeek).mastered++;
    }
  }

  const sortedWeeks = [...weekMap.keys()].sort();

  // Cumulative pass — both series grow monotonically.
  // "learning" = total words ever encountered up to this week
  // "mastered" = total words ever mastered up to this week
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
    where: { userId_language: { userId: session.user.id, language } },
    select: { id: true },
  });

  if (!userLanguage) return [];

  const now = new Date();
  const dormantCutoff = new Date(now.getTime() - DORMANT_DAYS_THRESHOLD * 24 * 60 * 60 * 1000);
  const decayCutoff   = new Date(now.getTime() - DECAY_FETCH_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const masteries = await prisma.userGrammarMastery.findMany({
    where: { userLanguageId: userLanguage.id },
    include: { grammarConcept: true },
  });

  if (masteries.length === 0) return [];

  const recentErrors = await prisma.grammarError.findMany({
    where: {
      userLanguageId: userLanguage.id,
      createdAt: { gte: decayCutoff },
    },
    orderBy: { createdAt: "desc" },
    take: ERROR_FETCH_LIMIT,
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
    const recentScore   = computeDecayScore(conceptErrors, now);
    const isDormant     = mastery.lastSeenAt < dormantCutoff;

    return {
      conceptId:    mastery.grammarConceptId,
      name:         mastery.grammarConcept.name,
      description:  mastery.grammarConcept.description,
      errorCount:   mastery.errorCount,
      recentScore,
      lastSeenAt:   mastery.lastSeenAt.toISOString().slice(0, 10),
      isMastered:   isDormant,
      recentErrors: conceptErrors.slice(0, 5).map((e) => ({
        userSentence: e.userSentence,
        correction:   e.correction,
        explanation:  e.explanation,
        date:         e.createdAt.toISOString().slice(0, 10),
      })),
    };
  });

  const active   = rows.filter((r) => !r.isMastered).sort((a, b) => b.recentScore - a.recentScore);
  const dormant  = rows.filter((r) =>  r.isMastered).sort((a, b) => b.errorCount - a.errorCount);

  return [...active, ...dormant];
}

export async function getWeeklySummary(language: string, forceRefresh = false): Promise<WeeklySummaryResult | null> {
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

  if (!forceRefresh && cached && cached.generatedAt > sevenDaysAgo) {
    return {
      content: cached.content,
      generatedAt: cached.generatedAt.toISOString().slice(0, 10),
    };
  }
  const { success } = await weeklySummaryLimiter.limit(session.user.id);
  if (!success) throw new Error("Rate limit exceeded. Try again later.");

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

  const [masteredCount, total, stateCounts] = await Promise.all([
    prisma.vocabularyItem.count({
      where: {
        userLanguageId: userLanguage.id,
        state: "REVIEW",
        reps: { gte: MASTERED_REPS_THRESHOLD },
      },
    }),
    prisma.vocabularyItem.count({
      where: { userLanguageId: userLanguage.id },
    }),
    prisma.vocabularyItem.groupBy({
      by: ["state"],
      where: { userLanguageId: userLanguage.id },
      _count: { state: true },
    }),
  ]);

  // groupBy returns one row per state value — build a lookup map
  const countByState = new Map<string, number>(
    stateCounts.map((row) => [row.state, row._count.state]),
  );

  // REVIEW count from groupBy includes both mastered and non-mastered REVIEW cards.
  const reviewCount = (countByState.get("REVIEW") ?? 0) - masteredCount;

  const newCount      = countByState.get("NEW") ?? 0;
  const learningCount = (countByState.get("LEARNING") ?? 0) + (countByState.get("RELEARNING") ?? 0);

  const nextMilestone = Math.max(25, Math.ceil((masteredCount + 1) / 25) * 25);
  const wordsUntilNextMilestone = nextMilestone - masteredCount;

  return {
    newCount,
    learningCount,
    reviewCount,
    masteredCount,
    total,
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

  const userLanguages = await prisma.userLanguage.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (userLanguages.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const userLanguageIds = userLanguages.map((ul) => ul.id);

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 365);

  const conversations = await prisma.conversation.findMany({
    where: {
      userLanguageId: { in: userLanguageIds },
      createdAt: { gte: since },
    },
    select: { createdAt: true },
  });

  const activeDates = new Set<string>();
  for (const c of conversations) {
    activeDates.add(c.createdAt.toISOString().slice(0, 10));
  }

  // Current streak 
  const today = new Date();
  const todayStr = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  ).toISOString().slice(0, 10);

  const yesterdayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  // Grace period: if today has no activity yet, treat yesterday as the
  // effective start of the backward walk so the streak doesn't reset at midnight.
  const startStr = activeDates.has(todayStr) ? todayStr : yesterdayStr;

  let currentStreak = 0;
  const cursor = new Date(startStr + "T00:00:00Z");

  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (activeDates.has(dateStr)) {
      currentStreak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }

  // Longest streak
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