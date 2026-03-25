"use client";

import { useState } from "react";
import type { GrammarConceptRow } from "@/app/actions/progress";

type Props = {
  data: GrammarConceptRow[];
};

function ErrorDetail({ error }: { error: GrammarConceptRow["recentErrors"][number] }) {
  return (
    <div className="border-l-2 border-slate-200 pl-3 py-1 space-y-1">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-red-500 line-through">{error.userSentence}</span>
        <span className="text-slate-600">{"->"}</span>
        <span className="text-emerald-600">{error.correction}</span>
      </div>
      <p className="text-slate-600 text-xs">{error.explanation}</p>
      <p className="text-slate-300 text-xs">{error.date}</p>
    </div>
  );
}

function ConceptRow({
  concept,
  maxScore,
}: {
  concept: GrammarConceptRow;
  maxScore: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const barWidth =
    maxScore > 0 ? Math.max((concept.recentScore / maxScore) * 100, 2) : 0;

  const intensityColor =
    barWidth > 66
      ? "bg-red-400"
      : barWidth > 33
        ? "bg-amber-400"
        : "bg-sky-400";

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left py-3 px-5 rounded-lg hover:bg-slate-50 transition-colors"
        disabled={concept.recentErrors.length === 0}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-slate-700 font-mono">
                {concept.name}
              </span>
              <span className="text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                {concept.errorCount} total
              </span>
            </div>
            <p className="text-xs text-slate-600 truncate">{concept.description}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${intensityColor}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            {concept.recentErrors.length > 0 && (
              <span
                className={`text-slate-600 text-xs transition-transform duration-200 ${
                  expanded ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            )}
          </div>
        </div>
      </button>

      {expanded && concept.recentErrors.length > 0 && (
        <div className="mx-5 mb-3 space-y-3">
          <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-2">
            Recent errors
          </p>
          {concept.recentErrors.map((error, i) => (
            <ErrorDetail key={i} error={error} />
          ))}
        </div>
      )}
    </div>
  );
}

export function GrammarHeatmap({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          No grammar data yet.
          <br />
          <span className="text-slate-600">
            Keep chatting — errors and patterns will appear here automatically.
          </span>
        </p>
      </div>
    );
  }

  const active = data.filter((c) => !c.isMastered);
  const mastered = data.filter((c) => c.isMastered);
  const maxScore = Math.max(...active.map((c) => c.recentScore), 0.001);

  return (
    <div className="w-full space-y-1 py-2">
      {active.length > 0 && (
        <div className="space-y-0.5">
          {active.map((concept) => (
            <ConceptRow key={concept.conceptId} concept={concept} maxScore={maxScore} />
          ))}
        </div>
      )}

      {mastered.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-600 uppercase tracking-wider font-medium px-5 mb-2">
            No recent errors
          </p>
          <div className="space-y-0.5">
            {mastered.map((concept) => (
              <div
                key={concept.conceptId}
                className="flex items-center justify-between px-5 py-2.5"
              >
                <div>
                  <span className="text-sm text-slate-600 font-mono">{concept.name}</span>
                  <p className="text-xs text-slate-600">{concept.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">{concept.errorCount} total</span>
                  <span className="text-emerald-500 text-xs font-medium">✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}