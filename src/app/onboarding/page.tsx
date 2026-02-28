import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserLanguages, addUserLanguage } from "@/app/actions/languages";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in" as never);

  const existing = await getUserLanguages();
  if (existing.length > 0) redirect("/dashboard" as never);

  return (
    <main>
      <h1>Choose a language to learn</h1>
      <p>You can add more languages later.</p>
      <div>
        <form
          action={async () => {
            "use server";
            const lang = await addUserLanguage("es");
            redirect(`/assessment/${lang}` as never);
          }}
        >
          <button type="submit">Spanish</button>
        </form>
        <form
          action={async () => {
            "use server";
            const lang = await addUserLanguage("it");
            redirect(`/assessment/${lang}` as never);
          }}
        >
          <button type="submit">Italian</button>
        </form>
      </div>
    </main>
  );
}
