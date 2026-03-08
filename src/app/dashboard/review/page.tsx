import { redirect } from "next/navigation";
import { getUserLanguages } from "@/app/actions/languages";
import { getUserLanguageByCode } from "@/app/actions/vocabulary";
import { getReviewQueue } from "@/app/actions/review";
import { ReviewClient } from "@/components/review/ReviewClient";

interface ReviewPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const { lang } = await searchParams;

  const userLanguages = await getUserLanguages();

  if (userLanguages.length === 0) {
    redirect("/dashboard");
  }

  if (!lang || !userLanguages.some((ul) => ul.language === lang)) {
    const firstLang = userLanguages[0];
    if (!firstLang) redirect("/dashboard");
    redirect(`/dashboard/review?lang=${firstLang.language}` as never);
  }

  const userLanguage = await getUserLanguageByCode(lang);
  if (!userLanguage) redirect("/dashboard/review" as never);

  const queue = await getReviewQueue(userLanguage.id);
  const languages = userLanguages.map((ul) => ul.language);

  return (
    <ReviewClient
      queue={queue}
      languages={languages}
      currentLang={lang}
    />
  );
}