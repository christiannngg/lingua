"use client";

import AtomModel from "./AtomModel";

export default function LightbulbOrb() {
    return (
        <svg
            viewBox="0 0 500 580"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "100%", height: "100%" }}
            aria-hidden="true"
        >
            <defs>
                <radialGradient id="bulbGlow" cx="50%" cy="42%" r="48%">
                    <stop offset="0%" stopColor="#f0e4ff" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#f7f3ff" stopOpacity="0" />
                </radialGradient>


            </defs>

            {/* ── Bulb interior glow ── */}
            <ellipse cx="250" cy="220" rx="148" ry="148" fill="url(#bulbGlow)" />

            {/* ── Main bulb glass outline ── */}
            <path
                d="M 250 60 C 155 60, 95 130, 95 210 C 95 270, 125 315, 175 345 C 190 354, 198 368, 198 382 L 198 400 L 302 400 L 302 382 C 302 368, 310 354, 325 345 C 375 315, 405 270, 405 210 C 405 130, 345 60, 250 60 Z"
                fill="none"
                stroke="#CA7DF9"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />

            {/* ── Base separator ── */}
            <line x1="198" y1="400" x2="302" y2="400" stroke="#CA7DF9" strokeWidth="2.5" />

            {/* ── Screw base segments ── */}
            <path
                d="M 198 410 Q 250 418, 302 410 L 296 432 Q 250 440, 204 432 Z"
                fill="none"
                stroke="#CA7DF9"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M 204 432 Q 250 440, 296 432"
                fill="none"
                stroke="#CA7DF9"
                strokeWidth="1.5"
                opacity={0.6}
            />

            <path
                d="M 207 442 Q 250 450, 293 442 L 288 463 Q 250 471, 212 463 Z"
                fill="none"
                stroke="#CA7DF9"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M 212 463 Q 250 471, 288 463"
                fill="none"
                stroke="#CA7DF9"
                strokeWidth="1.5"
                opacity={0.6}
            />

            <path
                d="M 215 473 Q 250 481, 285 473 L 282 494 Q 250 500, 218 494 Z"
                fill="none"
                stroke="#CA7DF9"
                strokeWidth="2"
                strokeLinejoin="round"
            />

            <path
                d="M 218 494 Q 250 502, 282 494 L 280 510 Q 250 516, 220 510 Z"
                fill="none"
                stroke="#CA7DF9"
                strokeWidth="2"
                strokeLinejoin="round"
            />

            {/* ── Filament stems ── */}
            <line x1="250" y1="380" x2="250" y2="320" stroke="#CA7DF9" strokeWidth="1.5" opacity={0.35} />
            <line x1="232" y1="380" x2="232" y2="335" stroke="#CA7DF9" strokeWidth="1.5" opacity={0.25} />
            <line x1="268" y1="380" x2="268" y2="335" stroke="#CA7DF9" strokeWidth="1.5" opacity={0.25} />

            {/* ── Atom — centered at (250, 215) ── */}
           <foreignObject x="155" y="115" width="200" height="200">
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        // borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        color: "black",
                        // boxSizing: "border-box",
                    }}
                >
                    <AtomModel />
                </div>
            </foreignObject>

            {/* ── Glass glare / shine ── */}
            <path
                d="M 310 95 Q 360 120, 375 175"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                opacity={0.45}
            />
            <path
                d="M 330 110 Q 365 138, 372 165"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity={0.25}
            />
        </svg>
    );
}