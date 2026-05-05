"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getWeeklySummary } from "@/app/actions/progress";
import type { WeeklySummaryResult } from "@/app/actions/progress";

type Props = {
  initial: WeeklySummaryResult | null;
  language: string;
};

export function WeeklySummary({ initial, language }: Props) {
  const [summary, setSummary] = useState<WeeklySummaryResult | null>(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRefresh() {
    setError(null);
    startTransition(async () => {
      try {
        const fresh = await getWeeklySummary(language, true);
        setSummary(fresh);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
      }
    });
  }

  if (!summary) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center h-32 text-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-slate-600 text-sm leading-relaxed">
          No activity this week yet.
          <br />
          <span className="text-slate-400">Start a conversation to generate your summary.</span>
        </p>
      </motion.div>
    );
  }

  return (
    <div className="p-5 space-y-3">
      <AnimatePresence mode="wait">
        <motion.p
          key={isPending ? "pending" : summary.content}
          className="text-slate-600 text-sm leading-relaxed"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {isPending ? (
            <span className="text-slate-600 italic">Regenerating your summary…</span>
          ) : (
            summary.content
          )}
        </motion.p>
      </AnimatePresence>

      <div className="flex items-center justify-between pt-1">
        <span className="text-slate-400 text-xs" suppressHydrationWarning>
          Generated{" "}
          {new Date(summary.generatedAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="text-xs text-slate-400 hover:text-[#CA7DF9] transition-colors disabled:opacity-40 cursor-pointer"
        >
          {isPending ? "Regenerating..." : "↻ Regenerate"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-400 pt-1">{error}</p>
      )}
    </div>
  );
}