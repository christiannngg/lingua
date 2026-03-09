"use client";

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

const NUMERIC_TO_CEFR: Record<number, string> = {
  1: "A1",
  2: "A2",
  3: "B1",
  4: "B2",
  5: "C1",
  6: "C2",
};

const CEFR_COLORS: Record<string, string> = {
  A1: "#94a3b8",
  A2: "#64748b",
  B1: "#38bdf8",
  B2: "#0ea5e9",
  C1: "#818cf8",
  C2: "#6366f1",
};

type CustomDotProps = DotProps & {
  payload?: CefrDataPoint;
};

function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (cx === undefined || cy === undefined || !payload) return null;

  if (payload.isLevelUp) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#6366f1" stroke="#fff" strokeWidth={2} />
        <text
          x={cx}
          y={cy - 16}
          textAnchor="middle"
          fill="#6366f1"
          fontSize={11}
          fontWeight={600}
        >
          ↑ Level Up
        </text>
      </g>
    );
  }

  return <circle cx={cx} cy={cy} r={4} fill="#38bdf8" stroke="#fff" strokeWidth={2} />;
}

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: CefrDataPoint }>;
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-white font-semibold">{point.cefrLevel}</p>
      <p className="text-slate-400">{point.date}</p>
      {point.isLevelUp && (
        <p className="text-indigo-400 text-xs mt-1 font-medium">Level up! 🎉</p>
      )}
    </div>
  );
}

type Props = {
  data: CefrDataPoint[];
  language: string;
};

export function CefrHistoryChart({ data, language }: Props) {
  const languageName = getLanguageDisplayName(language);

  if (data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <p className="text-slate-400 text-sm leading-relaxed">
          Complete more assessments to see your {languageName} level history here.
          <br />
          <span className="text-slate-500">Your progress will be charted over time.</span>
        </p>
      </div>
    );
  }

  const levelBoundaries = [1, 2, 3, 4, 5, 6];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 24, right: 16, bottom: 8, left: 8 }}>
          {levelBoundaries.map((level) => (
            <ReferenceLine
              key={level}
              y={level}
              stroke="#1e293b"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          ))}
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            domain={[0.5, 6.5]}
            ticks={[1, 2, 3, 4, 5, 6]}
            tickFormatter={(v: number) => NUMERIC_TO_CEFR[v] ?? ""}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="numericLevel"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 justify-center mt-2 flex-wrap">
        {Object.entries(CEFR_COLORS).map(([level, color]) => (
          <span key={level} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {level}
          </span>
        ))}
      </div>
    </div>
  );
}