import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserLanguages, resetAssessment } from "@/app/actions/languages";
import { getMemories } from "../actions/memory";
import { MemoryDeleteButton } from "@/components/settings/MemoryDeleteButton";

const LANGUAGE_LABELS: Record<string, string> = {
  es: "🇪🇸 Spanish",
  it: "🇮🇹 Italian",
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in" as never);

  const userLanguages = await getUserLanguages();
  const memories = await getMemories();

  return (
    <main className="max-w-lg mx-auto p-8 text-white">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="mb-8" style={{ color: "var(--muted-foreground)" }}>
        Manage your language assessments.
      </p>

      <section>
        <h2 className="text-lg font-semibold mb-4">Language Assessments</h2>
        <div className="flex flex-col gap-4">
          {userLanguages.map((ul) => (
            <div
              key={ul.id}
              className="flex items-center justify-between rounded-xl border p-4"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <p className="font-medium">{LANGUAGE_LABELS[ul.language] ?? ul.language}</p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Current level: <span className="font-semibold text-white">{ul.cefrLevel}</span>
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  const lang = await resetAssessment(ul.language);
                  redirect(`/assessment/${lang}` as never);
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
      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-1">Conversation Memory</h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
          These are summaries Sofia and Marco use to remember past conversations. Removing a memory
          means it won't influence future sessions — your conversation history is preserved.
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
                      {memory.language === "es" ? "🇪🇸 Spanish" : "🇮🇹 Italian"}
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
