"use client";

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
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{total} words total</p>
      <p className="text-indigo-400">{mastered} mastered</p>
      <p className="text-sky-400">{learning} learning</p>
    </div>
  );
}

type Props = {
  data: VocabGrowthPoint[];
};

export function VocabularyGrowthChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <p className="text-slate-400 text-sm leading-relaxed">
          Start chatting to grow your vocabulary.
          <br />
          <span className="text-slate-500">
            Words you encounter will appear here week by week.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
          <defs>
            <linearGradient id="gradLearning" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradMastered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="week"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="learning"
            stackId="vocab"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="url(#gradLearning)"
          />
          <Area
            type="monotone"
            dataKey="mastered"
            stackId="vocab"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#gradMastered)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 justify-center mt-2">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-sky-400" />
          Learning
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-400" />
          Mastered
        </span>
      </div>
    </div>
  );
}