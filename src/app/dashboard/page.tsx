import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { getCefrHistory, getVocabularyGrowth, getGrammarHeatmap } from "@/app/actions/progress";
import { CefrHistoryChart } from "@/components/progress/CefrHistoryChart";
import { VocabularyGrowthChart } from "@/components/progress/VocabularyGrowthChart";
import { GrammarHeatmap } from "@/components/progress/GrammarHeatmap";
import { redirect } from "next/navigation";

const LANGUAGE_NAMES: Record<string, string> = {
  es: "Spanish",
  it: "Italian",
};

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
        <p className="text-slate-400 text-sm">
          No language selected yet.{" "}
          <a href="/onboarding" className="text-indigo-400 underline">
            Get started
          </a>
        </p>
      </main>
    );
  }

  const [cefrHistory, vocabGrowth, grammarData] = await Promise.all([
    getCefrHistory(activeLanguage.language),
    getVocabularyGrowth(activeLanguage.language),
    getGrammarHeatmap(activeLanguage.language),
  ]);

  const languageName = LANGUAGE_NAMES[activeLanguage.language] ?? activeLanguage.language;

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Progress</h1>
        <p className="text-slate-400 text-sm mt-1">
          {languageName} · {activeLanguage.cefrLevel}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          CEFR Level History
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <CefrHistoryChart data={cefrHistory} language={activeLanguage.language} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Vocabulary Growth
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <VocabularyGrowthChart data={vocabGrowth} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Grammar Patterns
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <GrammarHeatmap data={grammarData} />
        </div>
      </section>
    </main>
  );
}