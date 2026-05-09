import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { isSupportedLanguage } from "@/lib/languages.config";

interface ChatLayoutProps {
  children: React.ReactNode;
  params: Promise<{ language: string }>;
}

export default async function ChatLayout({ children, params }: ChatLayoutProps) {
  const { language } = await params;

  if (!isSupportedLanguage(language)) redirect("/dashboard");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const userLanguage = await prisma.userLanguage.findUnique({
    where: { userId_language: { userId: session.user.id, language } },
    select: { id: true },
  });

  if (!userLanguage) redirect("/dashboard");

  return <>{children}</>;
}