import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserLanguages, resetAssessment } from "@/app/actions/languages";

const LANGUAGE_LABELS: Record<string, string> = {
  es: "🇪🇸 Spanish",
  it: "🇮🇹 Italian",
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in" as never);

  const userLanguages = await getUserLanguages();

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
                  Current level:{" "}
                  <span className="font-semibold text-white">{ul.cefrLevel}</span>
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
    </main>
  );
}