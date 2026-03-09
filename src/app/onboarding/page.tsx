import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserLanguages, addUserLanguage, getAvailableLanguages } from "@/app/actions/languages";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in" as never);

  const existing = await getUserLanguages();
  if (existing.length > 0) redirect("/dashboard" as never);

  const availableLanguages = await getAvailableLanguages();

  return (
    <main>
      <h1>Choose a language to learn</h1>
      <p>You can add more languages later.</p>
      <div>
        {availableLanguages.map((lang) => (
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
            <button type="submit">{lang.displayName}</button>
          </form>
        ))}
      </div>
    </main>
  );
}