"use client";

import { useState, useTransition } from "react";
import { deleteMemory } from "@/app/actions/memory";
import { getLanguageDisplayName } from "@/lib/languages.config";

interface Props {
  memory: {
    id: string;
    language: string;
    conversationTitle?: string | null;
    createdAt: Date;
    summary: string;
  };
}

export function MemoryCard({ memory }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteMemory(memory.id);
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* ── Main content ── */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#f3e8ff", color: "#CA7DF9" }}
              >
                {getLanguageDisplayName(memory.language)}
              </span>
              {memory.conversationTitle && (
                <>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-400 truncate max-w-[180px]">
                    {memory.conversationTitle}
                  </span>
                </>
              )}
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-400">
                {memory.createdAt.toISOString().slice(0, 10)}
              </span>
            </div>

            {/* Summary */}
            <p className="text-sm text-slate-600 leading-relaxed">{memory.summary}</p>
          </div>

          {/* Forget / pending button — always top-right */}
          <div className="shrink-0 pt-0.5">
            {isPending ? (
              <span className="text-xs text-slate-400 italic">Removing…</span>
            ) : confirming ? (
              /* In confirming state the button becomes a muted "×" to cancel */
              <button
                onClick={() => setConfirming(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 border border-slate-200 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                Forget
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirmation banner — slides in at the bottom ── */}
      {confirming && !isPending && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-red-100 bg-red-50">
          <p className="text-xs text-red-500 font-medium">
            This memory will be permanently removed and won&apos;t influence future sessions.
          </p>
          <button
            onClick={handleConfirm}
            className="shrink-0 rounded-lg px-4 py-1.5 text-xs font-semibold bg-white text-red-500 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}