import { redirect } from "next/navigation";
import { getUserLanguages } from "@/app/actions/languages";
import {
  getVocabularyDashboard,
  getUserLanguageByCode,
} from "@/app/actions/vocabulary";
import { VocabularyClient } from "@/components/vocabulary/VocabularyClient";

interface VocabularyPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function VocabularyPage({ searchParams }: VocabularyPageProps) {
  const { lang } = await searchParams;

  const userLanguages = await getUserLanguages();

  if (userLanguages.length === 0) {
    redirect("/dashboard");
  }

  // If no lang param or invalid lang, redirect to first active language
  if (!lang || !userLanguages.some((ul) => ul.language === lang)) {
    const firstLang = userLanguages[0];
    if (!firstLang) redirect("/dashboard");
    redirect(`/dashboard/vocabulary?lang=${firstLang.language}` as never);
  }

  const userLanguage = await getUserLanguageByCode(lang);
  if (!userLanguage) redirect(`/dashboard/vocabulary` as never);

  const data = await getVocabularyDashboard(userLanguage.id);
  const languages = userLanguages.map((ul) => ul.language);

  return (
    <VocabularyClient
      data={data}
      languages={languages}
      currentLang={lang}
    />
  );
}