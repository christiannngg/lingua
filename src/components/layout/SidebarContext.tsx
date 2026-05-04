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
  // Initialize from localStorage synchronously to avoid flash
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return DEFAULT_STATE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? stored === "true" : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });

  const [activeLanguage, setActiveLanguageState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem("lingua:active-language");
    } catch {
      return null;
    }
  });

  const setActiveLanguage = useCallback((lang: string) => {
    setActiveLanguageState(lang);
    try {
      localStorage.setItem("lingua:active-language", lang);
    } catch { }
  }, []);

  // Hydration guard: re-read from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsExpanded(stored === "true");
      }
    } catch {
      // localStorage unavailable (e.g. SSR, private mode) — keep default
    }
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