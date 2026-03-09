"use client";

import { getLanguageConfig } from "@/lib/languages.config";
import * as Flags from "country-flag-icons/react/3x2";

interface Props {
  language: string;
  className?: string;
}

export function LanguageFlag({ language, className = "w-5 h-auto" }: Props) {
  const config = getLanguageConfig(language);
  if (!config) return null;

  // Flags exports a component per ISO code e.g. Flags["ES"], Flags["FR"]
  const FlagComponent = Flags[config.flagCode as keyof typeof Flags];
  if (!FlagComponent) return null;

  return <FlagComponent title={config.displayName} className={className} />;
}