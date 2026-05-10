"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AssessmentResult } from "./types";

interface Props {
  result: AssessmentResult;
  languageName: string;
}

// Maps each CEFR level to a short motivational tag shown beneath the badge
const LEVEL_TAGS: Record<string, string> = {
  A1: "Every expert started here.",
  A2: "You've got the foundation — now we build.",
  B1: "Conversational and climbing.",
  B2: "Upper intermediate — you're in great shape.",
  C1: "Advanced. Almost effortless.",
  C2: "Near-native. Impressive.",
};

export function AssessmentResultScreen({ result, languageName }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  // Trigger entrance animation after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const ringColor = "#CA7DF9";

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.72); }
          65%  { transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes ringPulse {
          0%, 100% { box-shadow: 0 0 0 0px #CA7DF944; }
          50%       { box-shadow: 0 0 0 14px #CA7DF900; }
        }
        .result-fade-1 { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) both; animation-delay: 0.05s; }
        .result-fade-2 { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) both; animation-delay: 0.18s; }
        .result-fade-3 { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) both; animation-delay: 0.32s; }
        .result-fade-4 { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) both; animation-delay: 0.46s; }
        .cefr-badge    { animation: popIn 0.6s cubic-bezier(.22,1,.36,1) both; animation-delay: 0.22s; }
        .ring-pulse    { animation: ringPulse 2.4s ease-in-out infinite; animation-delay: 0.9s; }
        .cta-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .cta-btn:active { transform: translateY(0); }
      `}</style>

      <main
        style={{
          minHeight: "100dvh",
          backgroundColor: "#F7F7FF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.25rem",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0",
          }}
        >
          {/* Eyebrow */}
          <p
            className="result-fade-1"
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#CA7DF9",
              marginBottom: "0.75rem",
            }}
          >
            Assessment complete
          </p>

          {/* Headline */}
          <h1
            className="result-fade-2"
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 800,
              color: "#000000",
              textAlign: "center",
              lineHeight: 1.2,
              margin: "0 0 0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Your {languageName} level
          </h1>

          <p
            className="result-fade-2 text-slate-500"
            style={{
              fontSize: "0.9375rem",
              textAlign: "center",
              marginBottom: "2.25rem",
            }}
          >
            Here's where your journey begins.
          </p>

          {/* CEFR badge card */}
          <div
            className="result-fade-3"
            style={{
              width: "100%",
              backgroundColor: "#FFFFFF",
              borderRadius: "1.25rem",
              padding: "2.25rem 2rem",
              boxShadow: "0 4px 24px rgba(2, 1, 34, 0.07), 0 1px 4px rgba(2,1,34,0.04)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.25rem",
              marginBottom: "1.25rem",
              border: "1px solid #EDE9FE",
            }}
          >
            {/* Ring + level badge */}
            <div
              className="ring-pulse"
              style={{
                width: "8rem",
                height: "8rem",
                borderRadius: "50%",
                border: `3px solid ${ringColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${ringColor}12`,
              }}
            >
              <div
                className="cefr-badge"
                style={{
                  fontSize: "2.75rem",
                  fontWeight: 900,
                  color: "#000000",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {result.cefrLevel}
              </div>
            </div>

            {/* Level description */}
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "1rem",
                  lineHeight: 1.6,
                  margin: "0 0 0.5rem",
                  fontWeight: 500,
                }}
                className="text-slate-500"
              >
                {result.cefrDescription}
              </p>
            </div>

            {/* Divider */}
            <div
              style={{
                width: "100%",
                height: "1px",
                backgroundColor: "#F3F4F6",
              }}
            />

            {/* Scale strip */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#9CA3AF",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                CEFR Scale
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "0.3rem",
                  justifyContent: "center",
                  flexWrap: "nowrap",
                }}
              >
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => {
                  const isActive = level === result.cefrLevel;
                  return (
                    <div
                      key={level}
                      style={{
                        flex: 1,
                        maxWidth: "3rem",
                        padding: "0.3rem 0",
                        borderRadius: "0.375rem",
                        backgroundColor: isActive ? ringColor : "#F3F4F6",
                        color: isActive ? "#fff" : "#9CA3AF",
                        fontSize: "0.75rem",
                        fontWeight: isActive ? 800 : 500,
                        textAlign: "center",
                        transition: "background-color 0.2s",
                      }}
                    >
                      {level}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="result-fade-4" style={{ width: "100%" }}>
            <button
              className="cta-btn"
              onClick={() => router.push("/dashboard")}
              style={{
                width: "100%",
                padding: "0.9rem 1.5rem",
                backgroundColor: "#CA7DF9",
                color: "#fff",
                border: "none",
                borderRadius: "0.875rem",
                fontSize: "0.9375rem",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "-0.01em",
                transition: "opacity 0.15s, transform 0.15s",
              }}
            >
              Begin Journey
            </button>
          </div>

          {/* Footer note */}
          <p
            className="result-fade-4 text-slate-500"
            style={{
              marginTop: "1rem",
              fontSize: "0.8125rem",
              textAlign: "center",
              lineHeight: 1.5,
            }}
            
          >
            You can retake this assessment anytime in your settings.
          </p>
        </div>
      </main>
    </>
  );
}