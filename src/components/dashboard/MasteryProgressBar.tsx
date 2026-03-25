"use client";

import { useEffect, useRef } from "react";
import * as Progress from "@radix-ui/react-progress";
import { motion } from "framer-motion";
import { animate } from "framer-motion";
import type { MasteryProgress } from "@/app/actions/progress";

type Props = {
  data: MasteryProgress | null;
};

// Tier pill — small colored badge
function TierPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-slate-600">{label}</span>
      <span className="text-xs font-semibold tabular-nums" style={{ color: "#020122" }}>
        {count}
      </span>
    </div>
  );
}

export function MasteryProgressBar({ data }: Props) {
  const masteredRef = useRef<HTMLSpanElement>(null);

  // Count-up the mastered number on mount
  useEffect(() => {
    if (!data || !masteredRef.current) return;
    const controls = animate(0, data.masteredCount, {
      duration: 1.0,
      ease: [0.16, 1, 0.3, 1] as const,
      onUpdate(v) {
        if (masteredRef.current) {
          masteredRef.current.textContent = Math.round(v).toString();
        }
      },
    });
    return () => controls.stop();
  }, [data]);

  if (!data || data.total === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-sm text-slate-600 text-center">
        Start chatting to build your vocabulary list.
      </div>
    );
  }

  const progressPct = Math.min(
    100,
    Math.round((data.masteredCount / data.nextMilestone) * 100)
  );

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
    >
      {/* Mastered count + milestone label */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span
              ref={masteredRef}
              className="text-3xl font-bold tabular-nums"
              style={{ color: "#020122" }}
            >
              {data.masteredCount}
            </span>
            <span className="text-sm text-slate-600">/ {data.nextMilestone} mastered</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            {data.wordsUntilNextMilestone} word
            {data.wordsUntilNextMilestone !== 1 ? "s" : ""} until next milestone
          </p>
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "#ede9fe", color: "#7c3aed" }}
        >
          {progressPct}%
        </span>
      </div>

      {/* Radix animated progress bar */}
      <Progress.Root
        className="relative overflow-hidden rounded-full h-2"
        style={{ background: "#ede9fe" }}
        value={progressPct}
      >
        <Progress.Indicator
          className="h-full rounded-full transition-transform duration-700 ease-out"
          style={{
            background: "linear-gradient(90deg, #a855f7, #CA7DF9)",
            transform: `translateX(-${100 - progressPct}%)`,
          }}
        />
      </Progress.Root>

      {/* Tier breakdown */}
      <div className="flex items-center gap-5 flex-wrap pt-1">
        <TierPill label="New"       count={data.newCount}      color="#94a3b8" />
        <TierPill label="Learning"  count={data.learningCount} color="#38bdf8" />
        <TierPill label="Review"    count={data.reviewCount}   color="#a855f7" />
        <TierPill label="Mastered"  count={data.masteredCount} color="#22c55e" />
      </div>
    </motion.div>
  );
}