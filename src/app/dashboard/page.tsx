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

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in" as never);

  const userLanguages = await prisma.userLanguage.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const activeLanguage = userLanguages[0];

  if (!activeLanguage) {
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

  const enrolledCodes = userLanguages.map((ul) => ul.language as SupportedLanguage);

  const dueCount = await prisma.vocabularyItem.count({
    where: {
      userLanguageId: { in: userLanguages.map((ul) => ul.id) },
      nextReview: { lte: new Date() },
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
    getCefrHistory(activeLanguage.language),
    getVocabularyGrowth(activeLanguage.language),
    getGrammarHeatmap(activeLanguage.language),
    getWeeklySummary(activeLanguage.language),
    getWordOfTheDay(activeLanguage.language),
    getActivityHeatmap(activeLanguage.language),
    getMasteryProgress(activeLanguage.language),
  ]);

  return (
    <DashboardShell
      firstName={session.user.name?.split(" ")[0] ?? "there"}
      languageName={getLanguageDisplayName(activeLanguage.language)}
      cefrLevel={activeLanguage.cefrLevel}
      activeLanguage={activeLanguage.language as SupportedLanguage}
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