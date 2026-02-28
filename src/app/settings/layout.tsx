import { AppNav } from "@/components/layout/AppNav";
import { getUserLanguages } from "@/app/actions/languages";

type UserLanguage = Awaited<ReturnType<typeof getUserLanguages>>[number];

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userLanguages = await getUserLanguages();
  const languages = userLanguages.map((ul: UserLanguage) => ul.language);

  return (
    <div className="flex h-screen">
      <AppNav languages={languages} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}