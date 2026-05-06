"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

const STORAGE_KEY = "lingua:sidebar";
const DEFAULT_STATE = true; // expanded by default on first visit

interface SidebarContextValue {
  isExpanded: boolean;
  toggle: () => void;
  activeLanguage: string | null;
  setActiveLanguage: (lang: string) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState<boolean>(DEFAULT_STATE);
  const [activeLanguage, setActiveLanguageState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedExpanded = localStorage.getItem(STORAGE_KEY);
      if (storedExpanded !== null) {
        setIsExpanded(storedExpanded === "true");
      }

      const storedLang = localStorage.getItem("lingua:active-language");
      if (storedLang !== null) {
        setActiveLanguageState(storedLang);
      }
    } catch {
      // localStorage unavailable (private browsing, etc.) — keep defaults
    }
  }, []);

  const setActiveLanguage = useCallback((lang: string) => {
    setActiveLanguageState(lang);
    try {
      localStorage.setItem("lingua:active-language", lang);
    } catch { }
  }, []);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ isExpanded, toggle, activeLanguage, setActiveLanguage }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
}