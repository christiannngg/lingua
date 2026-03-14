import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserLanguages, addUserLanguage, getAvailableLanguages } from "@/app/actions/languages";
import { LanguageFlag } from "@/components/ui/LanguageFlag";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in" as never);

  const [existing, allLanguages] = await Promise.all([
    getUserLanguages(),
    getAvailableLanguages(),
  ]);

  const addedCodes = new Set(existing.map((ul) => ul.language));
  const addable = allLanguages.filter((lang) => !addedCodes.has(lang.code));

  if (addable.length === 0) {
    redirect("/dashboard" as never);
  }

  const isFirstLanguage = existing.length === 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isFirstLanguage ? "Choose a language to learn" : "Add a language"}
          </h1>
          <p style={{ color: "var(--muted-foreground)" }}>
            {isFirstLanguage
              ? "You'll take a short assessment to find your starting level."
              : "Pick a new language to start learning. You'll take a short assessment first."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {addable.map((lang) => (
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
                className="w-full flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-colors hover:bg-white hover:text-black group"
                style={{ borderColor: "var(--border)" }}
              >
                <LanguageFlag language={lang.code} className="w-8 h-6 rounded-sm shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-white group-hover:text-black">
                    {lang.displayName}
                  </p>
                  <p
                    className="text-xs group-hover:text-black"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Learn with {lang.personaName}
                  </p>
                </div>
                <span
                  className="text-sm group-hover:text-black"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  ->
                </span>
              </button>
            </form>
          ))}
        </div>

        {!isFirstLanguage && (
          <div className="mt-6 text-center">
            <a
              href="/dashboard"
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              ← Back to dashboard
            </a>
          </div>
        )}
      </div>
    </main>
  );
}