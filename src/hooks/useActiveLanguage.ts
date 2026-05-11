"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useSidebar } from "@/components/layout/SidebarContext";

/**
 * Resolves the active language using a two-tier priority chain:
 */
export function useActiveLanguage(enrolledCodes: string[]): string {
  const searchParams = useSearchParams();
  const { activeLanguage: contextLang } = useSidebar();

  return useMemo(() => {
    if (contextLang && enrolledCodes.includes(contextLang)) return contextLang;
    const langParam = searchParams.get("lang");
    if (langParam && enrolledCodes.includes(langParam)) return langParam;
    return enrolledCodes[0] ?? "es";
  }, [contextLang, searchParams, enrolledCodes]);
}