import { cache } from "react";
import { SideNav } from "@/components/layout/SideNav";
import { getUserLanguages } from "@/app/actions/languages";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { HeadNav } from "@/components/layout/HeadNav";

// ── cache() deduplicates this call within a single render pass ──────────────
// getUserLanguages is called on every dashboard page render to populate SideNav.
// The languages list doesn't change mid-session, so we wrap it with React's
// cache() to avoid redundant DB round-trips when multiple Server Components
// in the same render tree need the same data.
const getCachedUserLanguages = cache(getUserLanguages);

type UserLanguage = Awaited<ReturnType<typeof getUserLanguages>>[number];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userLanguages = await getCachedUserLanguages();
  const enrolledCodes = userLanguages.map((ul: UserLanguage) => ul.language);

  return (
    <div className="flex flex-col h-screen">
      <HeadNav enrolledCodes={enrolledCodes} />
      <div className="flex flex-1 overflow-hidden">
        <SideNav languages={enrolledCodes} />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
      <OfflineBanner />
    </div>
  );
}