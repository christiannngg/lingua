import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { getCefrHistory } from "@/app/actions/progress";
import { CefrHistoryChart } from "@/components/progress/CefrHistoryChart";
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

  // Use the first active language as the default view
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

  const cefrHistory = await getCefrHistory(activeLanguage.language);
  const languageName = LANGUAGE_NAMES[activeLanguage.language] ?? activeLanguage.language;

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Progress</h1>
        <p className="text-slate-400 text-sm mt-1">{languageName} · {activeLanguage.cefrLevel}</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          CEFR Level History
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <CefrHistoryChart data={cefrHistory} language={activeLanguage.language} />
        </div>
      </section>
    </main>
  );
}