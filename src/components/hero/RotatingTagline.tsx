"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PHRASES: [string, string][] = [
  ["Remembers", "Everything"],
  ["Understands ", "Your Level"],
  ["Catches Your", "Mistakes"],
  ["Guides Your", "Learning"],
  ["Grows With", " You"],
];

const HOLD_MS = 4000;
const PAUSE_MS = 700;
const SLIDE_MS = 760;
const STAGGER_MS = 50; // delay between line 1 and line 2

type Phase = "idle" | "transitioning";

export default function RotatingTagline() {
  const [current, setCurrent] = useState(0);
  const [incoming, setIncoming] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    rafRef.current = null;
    timerRef.current = null;
  };

  const goTo = useCallback((next: number) => {
    clearTimers();
    setIncoming(next);
    setPhase("transitioning");

    // account for the extra stagger time on line 2
    timerRef.current = setTimeout(
      () => {
        setCurrent(next);
        setIncoming(null);
        setPhase("idle");
        startRef.current = null;
      },
      SLIDE_MS + PAUSE_MS + STAGGER_MS + 60,
    );
  }, []);

  const goPrev = () => goTo((current - 1 + PHRASES.length) % PHRASES.length);
  const goNext = () => goTo((current + 1) % PHRASES.length);

  useEffect(() => {
    if (phase !== "idle") return;
    const tick = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      if (timestamp - startRef.current < HOLD_MS) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        goTo((current + 1) % PHRASES.length);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [current, phase, goTo]);

  const isTransitioning = phase === "transitioning";
  const easing = `cubic-bezier(0.76, 0, 0.24, 1)`;

  // staggerIndex: 0 = line 1 (leads), 1 = line 2 (follows)
  const renderSlot = (wordCurrent: string, wordIncoming: string | null, staggerIndex: number) => {
    const exitDelay = staggerIndex * STAGGER_MS;
    const enterDelay = PAUSE_MS + staggerIndex * STAGGER_MS;

    return (
      <div style={{ position: "relative", clipPath: "inset(0% -100% 0% -100%)" }}>
        {/* Outgoing — exits down, line 2 starts slightly after line 1 */}
        <div
          style={{
            lineHeight: 1.1,
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning
              ? "translateY(100%) translateZ(0)"
              : "translateY(0%) translateZ(0)",
            transition: isTransitioning
              ? `opacity ${SLIDE_MS}ms ${easing} ${exitDelay}ms, transform ${SLIDE_MS}ms ${easing} ${exitDelay}ms`
              : "none",
          }}
        >
          {wordCurrent}
        </div>

        {/* Incoming — enters from below, line 2 starts slightly after line 1 */}
        {wordIncoming !== null && (
          <div
            key={wordIncoming}
            style={{
              lineHeight: 1.1,
              position: "absolute",
              top: 0,
              left: 0,
              whiteSpace: "nowrap",
              opacity: 0,
              transform: "translateY(100%) translateZ(0)",
              animation: `slideDown ${SLIDE_MS}ms ${easing} ${enterDelay}ms forwards`,
            }}
          >
            {wordIncoming}
          </div>
        )}
      </div>
    );
  };

  const [curLine1, curLine2] = PHRASES[current]!;
  const incomingPhrase = incoming !== null ? PHRASES[incoming] : null;
  const [incLine1, incLine2] = incomingPhrase ?? [null, null];

  return (
    <div >
      <style>{`
        @keyframes slideDown {
          from { opacity: 1; transform: translateY(100%) translateZ(0); }
          to   { opacity: 1; transform: translateY(0%)    translateZ(0); }
        }
      `}</style>

      <h1
        style={{
          fontSize: "6rem",
          fontWeight: 700,
          lineHeight: 1.04,
          color: "#020122",
          letterSpacing: "-2px",
          fontFamily: "inherit",
          margin: 0,
        }}
      >
        {/* Line 1 — leads the stagger */}
        <div style={{ color: "#CA7DF9" }}>{renderSlot(curLine1, incLine1 ?? null, 0)}</div>

        {/* Line 2 — follows STAGGER_MS after line 1 */}
        <div style={{ color: "#CA7DF9" }}>{renderSlot(curLine2, incLine2 ?? null, 1)}</div>
      </h1>

      {/* Progress bars + arrows */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" ,marginTop: "24px", maxWidth: "300px" }}>
        <button
          onClick={goPrev}
          aria-label="Previous phrase"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "none",
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
            padding: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(202,125,249,0.10)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "none";
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M7.5 2L3.5 6l4 4"
              stroke="#CA7DF9"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div style={{ display: "flex", flex: 1, gap: "6px" }}>
          {PHRASES.map((_, i) => (
            <div
              key={i}
              style={{
                height: "1.5px",
                flex: 1,
                borderRadius: "99px",
                background: "rgba(202,125,249,0.18)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "99px",
                  background: "#CA7DF9",
                  width: i === (incoming ?? current) ? "100%" : "0%",
                  transition: "none",
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={goNext}
          aria-label="Next phrase"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "none",
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
            padding: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(202,125,249,0.10)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "none";
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M4.5 2l4 4-4 4"
              stroke="#CA7DF9"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
