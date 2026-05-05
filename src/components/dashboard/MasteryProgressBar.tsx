"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { animate } from "framer-motion";
import { MASTERY_COLORS } from "@/lib/mastery-colors";
import type { MasteryProgress } from "@/app/actions/progress";

type Props = {
  data: MasteryProgress | null;
};

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

const SEGMENTS = [
  { key: "New",      color: MASTERY_COLORS.New.dot      },
  { key: "Learning", color: MASTERY_COLORS.Learning.dot },
  { key: "Review",   color: MASTERY_COLORS.Review.dot   },
  { key: "Mastered", color: MASTERY_COLORS.Mastered.dot },
] as const;

type SegmentKey = typeof SEGMENTS[number]["key"];

function getCount(data: MasteryProgress, key: SegmentKey): number {
  switch (key) {
    case "New":      return data.newCount;
    case "Learning": return data.learningCount;
    case "Review":   return data.reviewCount;
    case "Mastered": return data.masteredCount;
  }
}

export function MasteryProgressBar({ data }: Props) {
  const masteredRef = useRef<HTMLSpanElement>(null);

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

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
    >
      {/* Mastered count + total */}
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
          {data.total} word{data.total !== 1 ? "s" : ""} in your vocabulary
        </p>
      </div>

      {/* Stacked proportional bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
        {SEGMENTS.map((seg, i) => {
          const count = getCount(data, seg.key);
          const widthPct = (count / data.total) * 100;
          if (widthPct === 0) return null;
          return (
            <motion.div
              key={seg.key}
              className="h-full shrink-0"
              style={{
                backgroundColor: seg.color,
                // Small gap between segments via outline trick — no layout shift
                boxShadow: i > 0 ? "-1px 0 0 0 white" : undefined,
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${widthPct}%` }}
              transition={{
                duration: 0.7,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          );
        })}
      </div>

      {/* Tier breakdown pills */}
      <div className="flex items-center gap-5 flex-wrap pt-1">
        <TierPill label="New"      count={data.newCount}      color={MASTERY_COLORS.New.dot}      />
        <TierPill label="Learning" count={data.learningCount} color={MASTERY_COLORS.Learning.dot} />
        <TierPill label="Review"   count={data.reviewCount}   color={MASTERY_COLORS.Review.dot}   />
        <TierPill label="Mastered" count={data.masteredCount} color={MASTERY_COLORS.Mastered.dot} />
      </div>
    </motion.div>
  );
}