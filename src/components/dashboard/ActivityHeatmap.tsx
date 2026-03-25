"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ActivityDay } from "@/app/actions/progress";

type Props = {
  data: ActivityDay[];
  year?: number;
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_ROW_LABELS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };

function cellColor(count: number, isFuture: boolean, isBeforeSignup: boolean): string {
  if (isFuture) return "#eef0f3";
  if (isBeforeSignup) return "#f1f5f9";
  if (count === 0) return "#e2e8f0";
  if (count === 1) return "#ede9fe";
  if (count <= 3) return "#CA7DF9";
  return "#7c3aed";
}

// "2026-03-05" → "March 5th"
function formatTooltipDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number) as [number, number, number];
  const monthName =
    [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ][(m ?? 1) - 1] ?? "";
  const day = d ?? 1;
  const suffix =
    day >= 11 && day <= 13
      ? "th"
      : day % 10 === 1
        ? "st"
        : day % 10 === 2
          ? "nd"
          : day % 10 === 3
            ? "rd"
            : "th";
  return `${monthName} ${day}${suffix}`;
}

type TooltipState = {
  date: string;
  count: number;
  isFuture: boolean;
  isBeforeSignup: boolean;
  x: number;
  y: number;
} | null;

export function ActivityHeatmap({ data, year }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-slate-600">
        No activity data yet.
      </div>
    );
  }

  const displayYear = year ?? new Date().getFullYear();
  const totalConversations = data.reduce((s, d) => s + d.count, 0);

  const jan1 = new Date(Date.UTC(displayYear, 0, 1));
  const startOffset = (jan1.getUTCDay() + 6) % 7;

  const padded: (ActivityDay | null)[] = [...Array<null>(startOffset).fill(null), ...data];

  const weeks: (ActivityDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const monthPositions: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, colIdx) => {
    const firstReal = week.find((d) => d !== null);
    if (firstReal) {
      const m = new Date(firstReal.date).getUTCMonth();
      if (m !== lastMonth) {
        monthPositions.push({ col: colIdx, label: MONTH_NAMES[m] ?? "" });
        lastMonth = m;
      }
    }
  });

  const CELL = 13;
  const GAP = 2;
  const STEP = CELL + GAP;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" as const }}
    >
      <p className="text-sm font-semibold mb-4" style={{ color: "#020122" }}>
        <span className="text-base">{totalConversations}</span>
        <span className="text-slate-600 font-normal ml-1.5">
          conversation{totalConversations !== 1 ? "s" : ""} in {displayYear}
        </span>
      </p>

      <div className="overflow-x-auto pb-1">
        <div style={{ display: "flex", gap: 4, minWidth: "fit-content" }}>
          {/* Day-of-week labels */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: GAP,
              paddingTop: 20,
              width: 28,
              flexShrink: 0,
            }}
          >
            {Array.from({ length: 7 }).map((_, rowIdx) => (
              <div
                key={rowIdx}
                style={{
                  height: CELL,
                  fontSize: 10,
                  color: "#94a3b8",
                  lineHeight: `${CELL}px`,
                  textAlign: "right",
                  paddingRight: 4,
                }}
              >
                {DAY_ROW_LABELS[rowIdx] ?? ""}
              </div>
            ))}
          </div>

          {/* Month labels + grid */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "relative", height: 18, marginBottom: 2 }}>
              {monthPositions.map(({ col, label }) => (
                <span
                  key={col}
                  style={{
                    position: "absolute",
                    left: col * STEP,
                    fontSize: 11,
                    color: "#94a3b8",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", gap: GAP }}>
              {weeks.map((week, colIdx) => (
                <div key={colIdx} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                  {Array.from({ length: 7 }).map((_, rowIdx) => {
                    const day = week[rowIdx] ?? null;
                    return (
                      <div
                        key={rowIdx}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 3,
                          backgroundColor: day
                            ? cellColor(day.count, day.isFuture, day.isBeforeSignup)
                            : "transparent",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          if (!day) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            date: day.date,
                            count: day.count,
                            isFuture: day.isFuture,
                            isBeforeSignup: day.isBeforeSignup,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span style={{ fontSize: 11, color: "#94a3b8", marginRight: 2 }}>Less</span>
        {(["#e2e8f0", "#ede9fe", "#CA7DF9", "#7c3aed"] as const).map((color) => (
          <div
            key={color}
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 3,
              backgroundColor: color,
              flexShrink: 0,
            }}
          />
        ))}
        <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 2 }}>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: "translate(-50%, -100%)",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          {tooltip.count > 0 && !tooltip.isFuture && !tooltip.isBeforeSignup ? (
            <>
              <p className="text-slate-600" style={{ color: "#020122" }}>
                {" "}
                {tooltip.count} conversation{tooltip.count !== 1 ? "s" : ""}on{" "}
                {formatTooltipDate(tooltip.date)}
              </p>
            </>
          ) : (
            <p className="text-slate-600" style={{ color: "#020122" }}>No conversations on {formatTooltipDate(tooltip.date)}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
