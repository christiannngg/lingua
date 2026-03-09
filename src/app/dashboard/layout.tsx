// src/app/dashboard/layout.tsx
import { AppNav } from "@/components/layout/AppNav";
import { getUserLanguages } from "@/app/actions/languages";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

type UserLanguage = Awaited<ReturnType<typeof getUserLanguages>>[number];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userLanguages = await getUserLanguages();
  const languages = userLanguages.map((ul : UserLanguage) => ul.language);

  return (
     <div className="flex h-screen">
      <AppNav languages={languages} />
      <div className="flex-1 overflow-auto">{children}</div>
      <OfflineBanner />
    </div>
  );
}