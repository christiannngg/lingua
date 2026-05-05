import { cache } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getUserLanguages } from "@/app/actions/languages";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { getGlobalStreak } from "../actions/progress";

const getCachedUserLanguages = cache(getUserLanguages);

type UserLanguage = Awaited<ReturnType<typeof getUserLanguages>>[number];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userLanguages, streakData] = await Promise.all([
    getCachedUserLanguages(),
    getGlobalStreak(),
  ]);
  const enrolledCodes = userLanguages.map((ul: UserLanguage) => ul.language);

  return (
    <>
      <AppShell enrolledCodes={enrolledCodes} streakCount={streakData.currentStreak}>
        {children}
      </AppShell>
      <OfflineBanner />
    </>
  );
}