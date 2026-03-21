import { SideNav } from "@/components/layout/SideNav";
import { getUserLanguages } from "@/app/actions/languages";
import { HeadNav } from "@/components/layout/HeadNav";

type UserLanguage = Awaited<ReturnType<typeof getUserLanguages>>[number];

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const userLanguages = await getUserLanguages();
  const languages = userLanguages.map((ul: UserLanguage) => ul.language);
   const enrolledCodes = userLanguages.map((ul: UserLanguage) => ul.language);

  return (
    <div className="flex flex-col h-screen">
      <HeadNav enrolledCodes={languages}></HeadNav>
      <div className="flex h-screen">
        <SideNav languages={languages} />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
