import { AppNav } from "@/components/layout/AppNav";
import { getUserLanguages } from "@/app/actions/languages";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userLanguages = await getUserLanguages();
  const languages = userLanguages.map((ul) => ul.language);

  return (
    <div className="flex h-screen">
      <AppNav languages={languages} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}