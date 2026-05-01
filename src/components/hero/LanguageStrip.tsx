"use client";
import { getAllLanguages } from "@/lib/languages.config";
import * as Flags from "country-flag-icons/react/3x2";

const languages = getAllLanguages();
const items = [...languages, ...languages, ...languages, ...languages];

export default function LanguageStrip() {
  return (
    <div style={{
      width: "100%",
      overflow: "hidden",
      // padding: "0 0 72px",
      maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
    }}>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
          will-change: transform;
          gap: 10px;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="marquee-track">
        {items.map((lang, i) => {
          const Flag = Flags[lang.flagCode as keyof typeof Flags];
          return (
            <div
              key={`${lang.code}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              {Flag && (
                <Flag style={{ width: 175, height: 150}} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}