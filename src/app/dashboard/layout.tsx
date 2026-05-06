import { cache } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getUserLanguages } from "@/app/actions/languages";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { getGlobalStreak } from "../actions/progress";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const getCachedUserLanguages = cache(getUserLanguages);

type UserLanguage = Awaited<ReturnType<typeof getUserLanguages>>[number];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userLanguages, streakData, session] = await Promise.all([
    getCachedUserLanguages(),
    getGlobalStreak(),
    auth.api.getSession({ headers: await headers() }),
  ]);
  const enrolledCodes = userLanguages.map((ul: UserLanguage) => ul.language);
  const firstName = session?.user.name?.split(" ")[0] ?? "";
  return (
    <>
      <AppShell enrolledCodes={enrolledCodes} streakCount={streakData.currentStreak} firstName={firstName}>
        {children}
      </AppShell>
      <OfflineBanner />
    </>
  );
}