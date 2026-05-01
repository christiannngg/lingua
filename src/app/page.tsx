import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserLanguages } from "@/app/actions/languages";
import HomeNav from "@/components/hero/HomeNav";
import HomeHero from "@/components/hero/HomeHero";
import LanguageStrip from "@/components/hero/LanguageStrip";
import AppFeatures from "@/components/hero/AppFeatures";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <main
        style={{
          background: "#F7F7FF",
          minHeight: "100vh",
          width: "100%",
          fontFamily: "'DIN Round Pro', 'DINRoundPro', system-ui, sans-serif",
        }}
      >
        <HomeNav />
        <HomeHero />
        <LanguageStrip />
        <AppFeatures/>
      </main>
    );
  }

  const userLanguages = await getUserLanguages();
  if (userLanguages.length === 0) redirect("/onboarding");

  const incomplete = userLanguages.find((ul) => !ul.assessmentCompleted);
  if (incomplete) redirect(`/assessment/${incomplete.language}`);

  redirect("/dashboard");
}