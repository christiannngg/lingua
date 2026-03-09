"use client";

import { useState, useTransition } from "react";
import { getWeeklySummary } from "@/app/actions/progress";
import type { WeeklySummaryResult } from "@/app/actions/progress";

type Props = {
  initial: WeeklySummaryResult | null;
  language: string;
};

export function WeeklySummary({ initial, language }: Props) {
  const [summary, setSummary] = useState<WeeklySummaryResult | null>(initial);
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      // Force regeneration by clearing cache first via a dedicated action
      const fresh = await getWeeklySummary(language);
      setSummary(fresh);
    });
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center px-4">
        <p className="text-slate-400 text-sm leading-relaxed">
          No activity this week yet.
          <br />
          <span className="text-slate-500">Start a conversation to generate your summary.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-slate-300 text-sm leading-relaxed">{summary.content}</p>
      <div className="flex items-center justify-between pt-1">
        <span className="text-slate-600 text-xs">Generated {summary.generatedAt}</span>
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
        >
          {isPending ? "Regenerating..." : "↻ Regenerate"}
        </button>
      </div>
    </div>
  );
}