"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAnimate, animate } from "framer-motion";
import { LanguageFlag } from "@/components/ui/LanguageFlag";
import type { SupportedLanguage } from "@/lib/languages.config";

type Props = {
  dueCount: number;
  languages: SupportedLanguage[];
};

export function ReviewCard({ dueCount, languages }: Props) {
  const router = useRouter();
  const [scope, animateScope] = useAnimate();
  const countRef = useRef<HTMLSpanElement>(null);

  // ── Count-up animation on mount ──────────────────────────────────────────
  useEffect(() => {
    if (dueCount === 0 || !countRef.current) return;

    const controls = animate(0, dueCount, {
      duration: 1.25,
      ease: [1, 1, 0.3, 1],
      onUpdate(value) {
        if (countRef.current) {
          countRef.current.textContent = Math.round(value).toString();
        }
      },
    });

    return () => controls.stop();
  }, [dueCount]);

  // ── Card entrance ────────────────────────────────────────────────────────
  useEffect(() => {
    animateScope(
      scope.current,
      { opacity: [0, 1], y: [12, 0] },
      { duration: 0.4, ease: "easeOut" }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={scope}
      className="bg-white rounded-2xl p-6 flex flex-col gap-5 shadow-sm border border-slate-100 min-h-[220px]"
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: "#F3E8FF" }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="5" width="16" height="12" rx="2" fill="#CA7DF9" />
          <rect x="6" y="2" width="10" height="12" rx="2" fill="#a855f7" />
          <rect x="9" y="0" width="4" height="12" rx="2" fill="#7c3aed" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1">
        <h3 className="font-bold text-[#020122] text-lg leading-tight">Next Review</h3>
        <p className="text-slate-600 text-sm mt-1 leading-relaxed">
          {dueCount > 0 ? (
            <>
              <span
                ref={countRef}
                className="font-semibold tabular-nums"
                style={{ color: "#CA7DF9" }}
              >
                {dueCount}
              </span>
              {` card${dueCount === 1 ? "" : "s"} ready for recall based on FSRS schedule.`}
            </>
          ) : (
            "You're all caught up! No cards due right now."
          )}
        </p>
      </div>

      {/* Language flags */}
      {languages.length > 0 && (
        <div className="flex items-center gap-1">
          {languages.slice(0, 5).map((lang) => (
            <LanguageFlag key={lang} language={lang} />
          ))}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => router.push("/dashboard/review" as never)}
        disabled={dueCount === 0}
        className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: dueCount > 0 ? "#020122" : "#e2e8f0",
          color: dueCount > 0 ? "white" : "#94a3b8",
        }}
        onMouseEnter={(e) => {
          if (dueCount > 0)
            (e.currentTarget as HTMLButtonElement).style.background = "#1e1b4b";
        }}
        onMouseLeave={(e) => {
          if (dueCount > 0)
            (e.currentTarget as HTMLButtonElement).style.background = "#020122";
        }}
      >
        Review Now
      </button>
    </div>
  );
}