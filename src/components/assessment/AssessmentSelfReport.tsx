"use client";

import { LucideIcon, Signal, SignalHigh, SignalLow, SignalMedium, SignalZero } from "lucide-react";
import { useState } from "react";

export type SelfReportBand = "A1" | "A2" | "B1" | "C1";

interface SelfReportOption {
    band: SelfReportBand;
    label: string;
    sublabel: string;
    icon: LucideIcon;
}

const OPTIONS: SelfReportOption[] = [
    {
        band: "A1",
        label: "None",
        sublabel: "I've never studied it",
        icon: SignalZero
    },
    {
        band: "A2",
        label: "A little",
        sublabel: "I know some words and basics",
        icon: SignalLow
    },
    {
        band: "B1",
        label: "Conversational",
        sublabel: "I can hold a basic conversation",
        icon: SignalMedium
    },
    {
        band: "C1",
        label: "Fluent",
        sublabel: "I'm quite comfortable",
        icon: SignalHigh
    },
];

interface Props {
    languageName: string;
    personaName: string;
    onSelect: (band: SelfReportBand) => void;
}

export function AssessmentSelfReport({ languageName, personaName, onSelect }: Props) {
    const [selected, setSelected] = useState<SelfReportBand | null>(null);

    function handleSelect(band: SelfReportBand) {
        setSelected(band);
        // Brief delay so the user sees the selected state before the transition
        setTimeout(() => onSelect(band), 300);
    }

    return (
        <div
            className="flex h-full flex-col max-w-6xl mx-auto mt-20 "
            style={{color: "black"}}
        >
            {/* Header */}
            <div style={{ marginBottom: "2rem" }}>
                <p
                    style={{
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#CA7DF9",
                        marginBottom: "0.5rem",
                    }}
                    className="text-3xl font-bold"
                >
                    Before we begin
                </p>
                <h1
                    style={{
                        fontSize: "1.625rem",
                        fontWeight: 600,
                        lineHeight: 1.25,
                        margin: 0,
                    }}
                >
                    How much {languageName} do you know?
                </h1>
                <p
                    style={{
                        marginTop: "0.625rem",
                        fontSize: "0.9375rem",
                    }}
                    className="text-slate-500"
                >
                    {personaName} will tailor the conversation to your level — there are no right or wrong
                    answers here.
                </p>
            </div>

            {/* Option cards */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                }}
            >
                {OPTIONS.map((opt) => {

                    return (
                        <button
                            key={opt.band}
                            onClick={() => handleSelect(opt.band)}
                            disabled={selected !== null}
                            style={{
                               display: "flex",
                               alignItems: "center",
                               border: "1px solid red"
                            }}
                            className="rounded-xl border border-slate-100  shadow-md  px-3 py-2 text-left transition-colors hover:bg-white hover:text-black group cursor-pointer"
                        >
                           <div style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
                             {/* icon */}
                            <opt.icon
                                size={48}
                                color="#CA7DF9"
                            />

                            {/* Text */}
                            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "row", gap: "10px", alignItems: "center" }}>
                                <div
                                    style={{
                                        fontSize: "1rem",
                                    
                                    }}
                                >
                                    {opt.label}: 

                                </div>
                                <div
                                    style={{
                                        fontSize: "0.875rem",
                                        color: "#6B7280",
                                        marginTop: "0.125rem",
                                    }}
                                >
                                    
                                    {opt.sublabel}
                                </div>
                            </div>
                           </div>

                        </button>
                    );
                })}
            </div>

            {/* Footer note */}
            <p
                style={{
                    marginTop: "1.5rem",
                    fontSize: "0.8125rem",
                    textAlign: "center",
                    lineHeight: 1.5,
                }}
                className="text-slate-500"
            >
                Your answer helps {personaName} start at the right level — the conversation will
                confirm your exact placement.
            </p>
        </div>
    );
}