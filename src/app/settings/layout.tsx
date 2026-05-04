import { AppShell } from "@/components/layout/AppShell";
import { getUserLanguages } from "@/app/actions/languages";

type UserLanguage = Awaited<ReturnType<typeof getUserLanguages>>[number];

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const userLanguages = await getUserLanguages();
  const enrolledCodes = userLanguages.map((ul: UserLanguage) => ul.language);

  return (
    <AppShell enrolledCodes={enrolledCodes}>
      {children}
    </AppShell>
  );
}