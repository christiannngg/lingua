"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

/**
 * Reads ?lang= from the URL and validates it against the user's enrolled
 * language codes. Falls back to the first enrolled language if the param is
 * absent or invalid.
 *
 * @param enrolledCodes - array of language code strings the user is enrolled in
 * @returns the active language code string
 */
export function useActiveLanguage(enrolledCodes: string[]): string {
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");

  return useMemo(() => {
    if (langParam && enrolledCodes.includes(langParam)) return langParam;
    return enrolledCodes[0] ?? "es";
  }, [langParam, enrolledCodes]);
}