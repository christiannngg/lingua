import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { getUserLanguages } from "@/app/actions/languages";
import { isSupportedLanguage } from "@/lib/languages.config";

const getCachedUserLanguages = cache(getUserLanguages);

type UserLanguage = Awaited<ReturnType<typeof getUserLanguages>>[number];

interface ChatLayoutProps {
  children: React.ReactNode;
  params: Promise<{ language: string }>;
}

export default async function ChatLayout({
  children,
  params,
}: ChatLayoutProps) {
  const { language } = await params;

  if (!isSupportedLanguage(language)) redirect("/dashboard");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const [userLanguages, userLanguage] = await Promise.all([
    getCachedUserLanguages(),
    prisma.userLanguage.findUnique({
      where: { userId_language: { userId: session.user.id, language } },
      select: { id: true },
    }),
  ]);

  if (!userLanguage) redirect("/dashboard");

  const enrolledCodes = userLanguages.map((ul: UserLanguage) => ul.language);

  return (
    <>
      <AppShell enrolledCodes={enrolledCodes}>
        {children}
      </AppShell>
      <OfflineBanner />
    </>
  );
}