import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserLanguages, getAvailableLanguages } from "@/app/actions/languages";
import { getMemories } from "@/app/actions/memory";
import { MemoryDeleteButton } from "@/components/settings/MemoryDeleteButton";
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
    <main className="max-w-lg mx-auto p-8 text-black">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="mb-8" style={{ color: "var(--muted-foreground)" }}>
        Manage your languages and memory.
      </p>

      {/* ── Active languages ── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Your Languages</h2>
        <div className="flex flex-col gap-4">
          {userLanguages.map((ul) => (
            <div
              key={ul.id}
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Top row: flag + language name + level */}
              <div className="flex items-center gap-3 mb-3">
                <LanguageFlag language={ul.language} className="w-8 h-6 rounded-sm shrink-0" />
                <div>
                  <p className="font-medium">{getLanguageDisplayName(ul.language)}</p>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Current level:{" "}
                    <span className="font-semibold text-white">
                      {ul.cefrLevel ?? "Not assessed"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Bottom row: actions */}
              <div
                className="flex items-center justify-between gap-3 pt-3 border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <RetakeAssessmentButton language={ul.language} />
                <RemoveLanguageButton language={ul.language} isOnly={isOnly} />
              </div>
            </div>
          ))}
        </div>

        {hasUnadded && (
          <div className="mt-4">
            <Link
              href="/onboarding"
              className="flex items-center justify-center gap-2 w-full rounded-xl border px-4 py-3 text-sm font-medium transition-colors hover:bg-white hover:text-black"
              style={{ borderColor: "var(--border)" }}
            >
              + Add a language
            </Link>
          </div>
        )}
      </section>

      {/* ── Memory ── */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-1">Conversation Memory</h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
          These are summaries your tutors use to remember past conversations. Removing a memory
          means it won&apos;t influence future sessions — your conversation history is preserved.
        </p>

        {memories.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            No memories yet. Complete a conversation and start a new one to generate your first
            memory.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="rounded-xl border p-4"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium mb-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {getLanguageDisplayName(memory.language)}
                      {" · "}
                      {memory.conversationTitle ?? "Untitled conversation"}
                      {" · "}
                      {memory.createdAt.toISOString().slice(0, 10)}
                    </p>
                    <p className="text-sm leading-relaxed">{memory.summary}</p>
                  </div>
                  <div className="shrink-0">
                    <MemoryDeleteButton embeddingId={memory.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}