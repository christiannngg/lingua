"use client";

import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

// Progress within the full A1→C2 spectrum.
// Each level occupies 1/6 of the arc; we show completion of the current step.
function cefrProgress(level: string): number {
  const index = CEFR_ORDER.indexOf(level as (typeof CEFR_ORDER)[number]);
  if (index === -1) return 0;
  // e.g. B2 = index 3 → (3/6)*100 = 50 — shows the ring as half-full
  return Math.round((index / 6) * 100);
}

type Props = {
  cefrLevel: string;
  languageName: string;
};

export function CefrProgressRing({ cefrLevel, languageName }: Props) {
  const progress = cefrProgress(cefrLevel);

  return (
    <div className="flex items-center gap-3">
      {/* Ring */}
      <div style={{ width: 52, height: 52 }}>
        <CircularProgressbar
          value={progress}
          text={cefrLevel}
          styles={buildStyles({
            // Text
            textSize: "26px",
            textColor: "#020122",
            // Arc
            pathColor: "#CA7DF9",
            trailColor: "#ede9fe",
            // Animate on mount
            pathTransitionDuration: 0.8,
          })}
        />
      </div>

      {/* Label */}
      <div>
        <p className="text-sm font-semibold" style={{ color: "#020122" }}>
          {languageName}
        </p>
        <p className="text-xs text-slate-600">
          {progress}% through CEFR
        </p>
      </div>
    </div>
  );
}