import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserLanguages, getAvailableLanguages } from "@/app/actions/languages";
import { getMemories } from "@/app/actions/memory";
import { MemoryCard } from "@/components/settings/MemoryCard";
import { RemoveLanguageButton } from "@/components/settings/RemoveLanguageButton";
import { RetakeAssessmentButton } from "@/components/settings/RetakeAssessmentButton";
import { LanguageFlag } from "@/components/ui/LanguageFlag";
import { getLanguageDisplayName } from "@/lib/languages.config";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in" as never);

  const [userLanguages, memories, availableLanguages] = await Promise.all([
    getUserLanguages(),
    getMemories(),
    getAvailableLanguages(),
  ]);

  const addedCodes = new Set(userLanguages.map((ul) => ul.language));
  const hasUnadded = availableLanguages.some((lang) => !addedCodes.has(lang.code));
  const isOnly = userLanguages.length === 1;

  return (
    <main className="max-w-2xl mx-auto px-6 py-10" style={{ color: "#020122" }}>
      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "#020122" }}>
          Settings
        </h1>
        <p className="text-slate-500 mt-1">Manage your languages and conversation memory.</p>
      </div>

      {/* ── Active languages ── */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
          Your Languages
        </h2>

        <div className="flex flex-col gap-3">
          {userLanguages.map((ul) => (
            <div
              key={ul.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <LanguageFlag language={ul.language} className="w-9 h-7 rounded-md shrink-0 shadow-sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base" style={{ color: "#020122" }}>
                    {getLanguageDisplayName(ul.language)}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Current level:{" "}
                    {ul.cefrLevel ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold ml-1"
                        style={{ backgroundColor: "#f3e8ff", color: "#CA7DF9" }}
                      >
                        {ul.cefrLevel}
                      </span>
                    ) : (
                      <span className="text-slate-400 ml-1">Not assessed</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <RetakeAssessmentButton language={ul.language} />
                <RemoveLanguageButton language={ul.language} isOnly={isOnly} />
              </div>
            </div>
          ))}
        </div>

        {hasUnadded && (
          <div className="mt-3">
            <Link
              href="/onboarding"
              className="flex items-center justify-center gap-2 w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 text-sm font-medium text-slate-500 hover:border-slate-200 hover:text-slate-700 transition-colors"
            >
              <span className="text-lg leading-none" style={{ color: "#CA7DF9" }}>+</span>
              Add a language
            </Link>
          </div>
        )}
      </section>

      {/* ── Memory ── */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
          Conversation Memory
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          These summaries help your tutors recall past conversations. Removing one won&apos;t
          delete your chat history — it only stops that context from influencing future sessions.
        </p>

        {memories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
            <p className="text-sm text-slate-400">
              No memories yet. Finish a conversation and start a new one to generate your first
              memory.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {memories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}