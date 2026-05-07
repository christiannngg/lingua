"use client";

import { AnimatedPage, AnimatedSection } from "@/components/layout/AnimatedPage";

export function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <AnimatedPage className="max-w-2xl mx-auto px-6 py-10">
      <AnimatedSection>
        {children}
      </AnimatedSection>
    </AnimatedPage>
  );
}