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
          <h1 className="text-3xl font-bold text-black mb-2">
            {isFirstLanguage ? "Choose a language to learn" : "Add a language"}
          </h1>
          <p style={{ color: "black" }}>
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
              {/* ounded-sm p-1 transition-all duration-200 cursor-pointer bg-white border border-slate-100 shadow-sm */}
              <button
                type="submit"
                className="w-full flex items-center gap-4 rounded-xl border border-slate-100  shadow-md  px-5 py-4 text-left transition-colors hover:bg-white hover:text-black group cursor-pointer"
                // style={{ borderColor: "var(--border)" }}
              >
                <LanguageFlag language={lang.code} className="w-8 h-6 rounded-sm shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-black group-hover:text-black">
                    {lang.displayName}
                  </p>
                  <p
                    className="text-xs group-hover:text-black"
                    style={{ color: "black" }}
                  >
                    Learn with {lang.personaName}
                  </p>
                </div>
              </button>
            </form>
          ))}
        </div>

        {!isFirstLanguage && (
          <div className="mt-6 text-center">
            <a
              href="/dashboard"
              className="text-sm border border-slate-100 bg-white cursor-pointer p-4 shadow-md rounded-xl font-bold"
              style={{ color: "black" }}
            >
              ← Back to dashboard
            </a>
          </div>
        )}
      </div>
    </main>
  );
}