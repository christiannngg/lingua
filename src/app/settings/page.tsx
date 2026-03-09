import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserLanguages, resetAssessment, addUserLanguage, getAvailableLanguages } from "@/app/actions/languages";
import { getMemories } from "../actions/memory";
import { MemoryDeleteButton } from "@/components/settings/MemoryDeleteButton";
import { getLanguageDisplayName } from "@/lib/languages.config";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in" as never);

  const [userLanguages, memories, availableLanguages] = await Promise.all([
    getUserLanguages(),
    getMemories(),
    getAvailableLanguages(),
  ]);

  const addedCodes = new Set(userLanguages.map((ul) => ul.language));
  const unadded = availableLanguages.filter((lang) => !addedCodes.has(lang.code));

  return (
    <main className="max-w-lg mx-auto p-8 text-white">
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
              className="flex items-center justify-between rounded-xl border p-4"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <p className="font-medium">{getLanguageDisplayName(ul.language)}</p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Current level:{" "}
                  <span className="font-semibold text-white">{ul.cefrLevel ?? "Not assessed"}</span>
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  const result = await resetAssessment(ul.language);
                  if (result.success) {
                    redirect(`/assessment/${result.language}` as never);
                  }
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-white hover:text-black"
                  style={{ borderColor: "var(--border)" }}
                >
                  Re-take Assessment
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* ── Add a language ── */}
      {unadded.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-1">Add a Language</h2>
          <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
            Start learning a new language. You&apos;ll take a short assessment to find your level.
          </p>
          <div className="flex flex-col gap-3">
            {unadded.map((lang) => (
              <form
                key={lang.code}
                action={async () => {
                  "use server";
                  const result = await addUserLanguage(lang.code);
                  if (result.success) {
                    redirect(`/assessment/${result.language}` as never);
                  }
                }}
              >
                <button
                  type="submit"
                  className="w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-white hover:text-black"
                  style={{ borderColor: "var(--border)" }}
                >
                  + Start learning {lang.displayName}
                </button>
              </form>
            ))}
          </div>
        </section>
      )}

      {/* ── Memory ── */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-1">Conversation Memory</h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
          These are summaries Sofia and Marco use to remember past conversations. Removing a memory
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