"use client";

import { useState, useTransition } from "react";
import { resetAssessment } from "@/app/actions/languages";
import { useRouter } from "next/navigation";

interface Props {
  language: string;
}

export function RetakeAssessmentButton({ language }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleFirstClick() {
    setConfirming(true);
  }

  function handleCancel() {
    setConfirming(false);
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await resetAssessment(language);
      if (result.success) {
        router.push(`/assessment/${result.language}`);
      }
    });
  }

  if (isPending) {
    return (
      <span className="text-xs text-slate-400 italic">Starting…</span>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 whitespace-nowrap">Re-take assessment?</span>
        <button
          onClick={handleConfirm}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
          style={{ backgroundColor: "#CA7DF9" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#b76de8")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#CA7DF9")}
        >
          Confirm
        </button>
        <button
          onClick={handleCancel}
          className="rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleFirstClick}
      className="rounded-lg px-4 py-2 text-sm font-medium border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
    >
      Re-take Assessment
    </button>
  );
}