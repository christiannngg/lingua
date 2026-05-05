"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  type DotProps,
} from "recharts";
import type { CefrDataPoint } from "@/app/actions/progress";
import { getLanguageDisplayName } from "@/lib/languages.config";

//  Constants 

const NUMERIC_TO_CEFR: Record<number, string> = {
  1: "A1",
  2: "A2",
  3: "B1",
  4: "B2",
  5: "C1",
  6: "C2",
};

// Maps each level to a band color used as a subtle background fill.
// The line itself stays brand-purple; these tint the reference bands.
const CEFR_BAND_COLORS: Record<string, string> = {
  A1: "#e2e8f0",
  A2: "#cbd5e1",
  B1: "#bae6fd",
  B2: "#7dd3fc",
  C1: "#d8b4fe",
  C2: "#a855f7",
};

// Date formatting

/**
 * Converts "2025-03-14" → "Mar 14" for X-axis labels.
 * Avoids raw ISO strings which overflow and are hard to read.
 */
function formatDateLabel(isoDate: string): string {
  // Parse as UTC to avoid timezone-shift edge cases
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(Date.UTC(year ?? 2000, (month ?? 1) - 1, day ?? 1));
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// ── Custom dot 

type CustomDotProps = DotProps & { payload?: CefrDataPoint };

function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (cx === undefined || cy === undefined || !payload) return null;

  // Level-up: purple dot + label. Flip label below the dot at high levels
  // (C1/C2, numeric ≥ 5) so it doesn't clip against the top margin.
  if (payload.isLevelUp) {
    const labelY = (payload.numericLevel ?? 0) >= 5 ? cy + 22 : cy - 16;
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#CA7DF9" stroke="#fff" strokeWidth={2} />
        <text
          x={cx}
          y={labelY}
          textAnchor="middle"
          fill="#CA7DF9"
          fontSize={11}
          fontWeight={600}
        >
          ↑ Level Up
        </text>
      </g>
    );
  }

  // Level-down: red dot + label. Flip above the dot at low levels (A1/A2,
  // numeric ≤ 2) so it doesn't clip against the bottom margin.
  if (payload.isLevelDown) {
    const labelY = (payload.numericLevel ?? 6) <= 2 ? cy + 22 : cy - 16;
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#f87171" stroke="#fff" strokeWidth={2} />
        <text
          x={cx}
          y={labelY}
          textAnchor="middle"
          fill="#dc2626"
          fontSize={11}
          fontWeight={600}
        >
          ↓ Reassessed
        </text>
      </g>
    );
  }

  // Standard dot
  return (
    <circle cx={cx} cy={cy} r={4} fill="#CA7DF9" stroke="#fff" strokeWidth={2} />
  );
}

// Custom tooltip 

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: CefrDataPoint }>;
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold" style={{ color: "#000000" }}>
        {point.cefrLevel}
      </p>
      <p className="text-slate-500 text-xs">{formatDateLabel(point.date)}</p>
      {point.isLevelUp && (
        <p className="text-xs mt-1 font-medium" style={{ color: "#CA7DF9" }}>
          Level up! 🎉
        </p>
      )}
      {point.isLevelDown && (
        <p className="text-xs mt-1 font-medium text-red-500">
          Re-assessed ↓
        </p>
      )}
    </div>
  );
}

// Legend

function ChartLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3">
      {Object.entries(CEFR_BAND_COLORS).map(([level, color]) => (
        <span key={level} className="flex items-center gap-1.5 text-xs text-slate-500">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: color }}
          />
          {level}
        </span>
      ))}
      <span className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#CA7DF9]" />
        Level Up
      </span>
      <span className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400" />
        Re-assessed
      </span>
    </div>
  );
}

// Empty states

function SinglePointState({
  languageName,
  cefrLevel,
}: {
  languageName: string;
  cefrLevel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-6 gap-2">
      <p className="text-2xl font-bold" style={{ color: "#CA7DF9" }}>
        {cefrLevel}
      </p>
      <p className="text-slate-700 text-sm font-medium">
        Your starting level in {languageName}
      </p>
      <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
        Keep having conversations to unlock your level history chart. Your progress
        will be plotted each time you&apos;re re-assessed.
      </p>
    </div>
  );
}

function NoDataState({ languageName }: { languageName: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
      <p className="text-slate-500 text-sm leading-relaxed">
        Complete an assessment to see your {languageName} level history here.
      </p>
    </div>
  );
}

// Main component 

type Props = { data: CefrDataPoint[]; language: string };

export function CefrHistoryChart({ data, language }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const languageName = getLanguageDisplayName(language);

  // No assessments at all
  if (data.length === 0) {
    return <NoDataState languageName={languageName} />;
  }

  // Exactly one assessment — show a meaningful single-point state
  if (data.length === 1) {
    const firstPoint = data[0];
    return (
      <SinglePointState
        languageName={languageName}
        cefrLevel={firstPoint?.cefrLevel ?? "A1"}
      />
    );
  }

  // Limit X-axis ticks to avoid label crowding. Always show first + last;
  // fill remaining slots evenly up to a max of 6 visible labels.
  const maxTicks = 6;
  const tickInterval =
    data.length <= maxTicks ? 0 : Math.ceil((data.length - 1) / (maxTicks - 1));

  return (
    <motion.div
      ref={ref}
      className="w-full"
      aria-label={`${languageName} CEFR level history chart`}
      role="img"
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={data} margin={{ top: 28, right: 16, bottom: 8, left: 8 }}>
          {/* Dashed grid lines at each CEFR level */}
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <ReferenceLine
              key={level}
              y={level}
              stroke="#f1f5f9"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          ))}

          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            interval={tickInterval}
            tick={{ fill: "#000000", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            dy={8}
          />

          <YAxis
            domain={[0.5, 6.5]}
            ticks={[1, 2, 3, 4, 5, 6]}
            tickFormatter={(v: number) => NUMERIC_TO_CEFR[v] ?? ""}
            tick={{ fill: "#000000", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={32}
          />

          <Tooltip content={<CustomTooltip />} />

          <Line
            type="stepAfter"
            dataKey="numericLevel"
            stroke="#CA7DF9"
            strokeWidth={2.5}
            dot={<CustomDot />}
            activeDot={{ r: 6, fill: "#CA7DF9", stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={isInView}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>

      <ChartLegend />
    </motion.div>
  );
}