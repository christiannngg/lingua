import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import {
  getCefrHistory,
  getVocabularyGrowth,
  getGrammarHeatmap,
  getWeeklySummary,
  getWordOfTheDay,
  getActivityHeatmap,
  getMasteryProgress,
} from "@/app/actions/progress";
import { redirect } from "next/navigation";
import { getLanguageDisplayName } from "@/lib/languages.config";
import type { SupportedLanguage } from "@/lib/languages.config";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CardState } from "@/lib/fsrs";

interface DashboardPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { lang } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in" as never);

  const userLanguages = await prisma.userLanguage.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (userLanguages.length === 0) {

  const activeUserLanguage = userLanguages[0];

  return (
      <main className="max-w-2xl mx-auto p-6">
        <p className="text-slate-600 text-sm">
          No language selected yet.{" "}
          <a href="/onboarding" className="underline" style={{ color: "#CA7DF9" }}>
            Get started
          </a>
        </p>
      </main>
    );
  }

  // Resolve active language the same way review/vocabulary pages do.
  // If ?lang= is absent or invalid, redirect to the first enrolled language
  // so the URL always reflects which language is active.
  const enrolledCodes = userLanguages.map((ul) => ul.language as SupportedLanguage);
  if (!lang || !userLanguages.some((ul) => ul.language === lang)) {
    const firstLang = userLanguages[0];
    if (!firstLang) redirect("/onboarding" as never);
    redirect(`/dashboard?lang=${firstLang.language}` as never);
  }

  const activeUserLanguage = userLanguages.find((ul) => ul.language === lang) ?? userLanguages[0]!;

  const dueCount = await prisma.vocabularyItem.count({
  where: {
    userLanguageId: { in: userLanguages.map((ul) => ul.id) },
    OR: [
      { state: CardState.New },
      { nextReview: { lte: new Date() } },
    ],
  },
});

  const [
    cefrHistory,
    vocabGrowth,
    grammarData,
    weeklySummary,
    wordOfTheDay,
    activityData,
    masteryProgress,
  ] = await Promise.all([
    getCefrHistory(activeUserLanguage.language),
    getVocabularyGrowth(activeUserLanguage.language),
    getGrammarHeatmap(activeUserLanguage.language),
    getWeeklySummary(activeUserLanguage.language),
    getWordOfTheDay(activeUserLanguage.language),
    getActivityHeatmap(activeUserLanguage.language),
    getMasteryProgress(activeUserLanguage.language),
  ]);

  return (
    <DashboardShell
      languageName={getLanguageDisplayName(activeUserLanguage.language)}
      cefrLevel={activeUserLanguage.cefrLevel}
      activeLanguage={activeUserLanguage.language as SupportedLanguage}
      enrolledCodes={enrolledCodes}
      dueCount={dueCount}
      wordOfTheDay={wordOfTheDay}
      masteryProgress={masteryProgress}
      activityData={activityData}
      cefrHistory={cefrHistory}
      vocabGrowth={vocabGrowth}
      grammarData={grammarData}
      weeklySummary={weeklySummary}
    />
  );
}