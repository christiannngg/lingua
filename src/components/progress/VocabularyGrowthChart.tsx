"use client";

import { useId, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { VocabGrowthPoint } from "@/app/actions/progress";

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const mastered = payload.find((p) => p.name === "mastered")?.value ?? 0;
  const learning = payload.find((p) => p.name === "learning")?.value ?? 0;
  const total = mastered + learning;

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm shadow-lg">
      <p className="text-slate-600 mb-1">{label}</p>
      <p className="font-semibold" style={{ color: "#020122" }}>{total} words total</p>
      <p style={{ color: "#06b6d4" }}>{mastered} mastered</p>
      <p style={{ color: "#eab308" }}>{learning} learning</p>
    </div>
  );
}

// ── Inner chart component — owns the ref and useInView hook ──────────────────
// Extracted so that VocabularyGrowthChart can safely run its empty-state guards
// before any hooks that depend on DOM presence are called.

type InnerProps = {
  data: VocabGrowthPoint[];
  gradLearningId: string;
  gradMasteredId: string;
};

function VocabularyGrowthChartInner({ data, gradLearningId, gradMasteredId }: InnerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className="w-full"
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.08 }}
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
          <defs>
            <linearGradient id={gradLearningId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eab308" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={gradMasteredId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="week" tick={{ fill: "#000000", fontSize: 11 }} tickLine={false} axisLine={false} dy={8} tickFormatter={formatDateLabel} />
          <YAxis tick={{ fill: "#000000", fontSize: 11 }} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="mastered"
            stackId="vocab"
            stroke="#06b6d4"
            strokeWidth={2}
            fill={`url(#${gradMasteredId})`}
            isAnimationActive={isInView}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="learning"
            stackId="vocab"
            stroke="#eab308"
            strokeWidth={2}
            fill={`url(#${gradLearningId})`}
            isAnimationActive={isInView}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 justify-center mt-2">
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#eab308" }} />
          Learning
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#06b6d4" }} />
          Mastered
        </span>
      </div>
    </motion.div>
  );
}

// Public component — guards empty states, then delegates to inner 

type Props = { data: VocabGrowthPoint[] };

export function VocabularyGrowthChart({ data }: Props) {
  const id = useId();
  const gradLearningId = `gradLearning-${id}`;
  const gradMasteredId = `gradMastered-${id}`;

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          Start chatting to grow your vocabulary.
          <br />
          <span className="text-slate-600">Words you encounter will appear here week by week.</span>
        </p>
      </div>
    );
  }

  if (data.length === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          Great start — you&apos;re building momentum.
          <br />
          <span className="text-slate-600">Your growth chart will appear after your second week.</span>
        </p>
      </div>
    );
  }

  return (
    <VocabularyGrowthChartInner
      data={data}
      gradLearningId={gradLearningId}
      gradMasteredId={gradMasteredId}
    />
  );
}

function formatDateLabel(isoDate: string): string {
  // Parse as UTC to avoid timezone-shift edge cases
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(Date.UTC(year ?? 2000, (month ?? 1) - 1, day ?? 1));
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}