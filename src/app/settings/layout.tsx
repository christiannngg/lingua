import { AppShell } from "@/components/layout/AppShell";
import { getUserLanguages } from "@/app/actions/languages";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type UserLanguage = Awaited<ReturnType<typeof getUserLanguages>>[number];

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const userLanguages = await getUserLanguages();
  const enrolledCodes = userLanguages.map((ul: UserLanguage) => ul.language);

  const [session] = await Promise.all([
      auth.api.getSession({ headers: await headers() }),
    ]);

  const firstName = session?.user.name?.split(" ")[0] ?? "";

  return (
    <AppShell enrolledCodes={enrolledCodes} firstName={firstName}>
      {children}
    </AppShell>
  );
}