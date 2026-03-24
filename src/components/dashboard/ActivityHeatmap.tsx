"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ActivityDay } from "@/app/actions/progress";

type Props = {
  data: ActivityDay[];
};

// Color scale: 0 = empty, 1 = faint, 2-3 = mid, 4+ = full brand purple
function cellColor(count: number): string {
  if (count === 0) return "#f1f5f9";
  if (count === 1) return "#ede9fe";
  if (count <= 3)  return "#CA7DF9";
  return "#7c3aed";
}

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type TooltipState = {
  date: string;
  count: number;
  x: number;
  y: number;
} | null;

export function ActivityHeatmap({ data }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-slate-400">
        No activity data yet.
      </div>
    );
  }

  // Build a 52-week × 7-day grid.
  // Pad the start so week 0 col 0 aligns to the correct day-of-week.
  const firstDay = new Date(data[0]!.date);
  // getUTCDay(): 0=Sun,1=Mon...6=Sat — shift to Mon-first (0=Mon)
  const startOffset = (firstDay.getUTCDay() + 6) % 7;

  // Flatten into week columns
  const paddedData: (ActivityDay | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...data,
  ];

  const weeks: (ActivityDay | null)[][] = [];
  for (let i = 0; i < paddedData.length; i += 7) {
    weeks.push(paddedData.slice(i, i + 7));
  }

  // Month labels: find the first cell of each month change across weeks
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, colIdx) => {
    const firstReal = week.find((d) => d !== null);
    if (firstReal) {
      const month = new Date(firstReal.date).getUTCMonth();
      if (month !== lastMonth) {
        monthLabels.push({ col: colIdx, label: MONTH_NAMES[month] ?? "" });
        lastMonth = month;
      }
    }
  });

  const totalConversations = data.reduce((sum, d) => sum + d.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" as const }}
    >
      {/* Stats row */}
      <div className="flex items-center gap-6 mb-4">
        <div>
          <span className="text-xl font-bold" style={{ color: "#020122" }}>
            {totalConversations}
          </span>
          <span className="text-xs text-slate-400 ml-1.5">conversations</span>
        </div>
        <div>
          <span className="text-xl font-bold" style={{ color: "#020122" }}>
            {activeDays}
          </span>
          <span className="text-xs text-slate-400 ml-1.5">active days</span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="flex gap-0.5" style={{ minWidth: "fit-content" }}>
          {/* Day-of-week labels column */}
          <div className="flex flex-col gap-0.5 mr-1 mt-5">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-[10px] text-slate-400 leading-none flex items-center"
                style={{ height: 12, width: 22 }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex flex-col">
            {/* Month labels */}
            <div className="relative h-5 mb-0.5">
              {monthLabels.map(({ col, label }) => (
                <span
                  key={col}
                  className="absolute text-[10px] text-slate-400"
                  style={{ left: col * 13 }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-0.5">
              {weeks.map((week, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-0.5">
                  {week.map((day, rowIdx) => (
                    <div
                      key={rowIdx}
                      className="rounded-sm cursor-default transition-opacity hover:opacity-80"
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: day ? cellColor(day.count) : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!day) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({ date: day.date, count: day.count, x: rect.left, y: rect.top });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] text-slate-400 mr-0.5">Less</span>
        {["#f1f5f9", "#ede9fe", "#CA7DF9", "#7c3aed"].map((color) => (
          <div
            key={color}
            className="rounded-sm"
            style={{ width: 12, height: 12, backgroundColor: color }}
          />
        ))}
        <span className="text-[10px] text-slate-400 ml-0.5">More</span>
      </div>

      {/* Tooltip — rendered in a fixed portal-like position */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shadow-lg -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x + 6, top: tooltip.y - 6 }}
        >
          <p className="font-semibold" style={{ color: "#020122" }}>
            {tooltip.count} conversation{tooltip.count !== 1 ? "s" : ""}
          </p>
          <p className="text-slate-400">{tooltip.date}</p>
        </div>
      )}
    </motion.div>
  );
}