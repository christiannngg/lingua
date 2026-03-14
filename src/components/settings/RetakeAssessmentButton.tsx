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
      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        Starting…
      </span>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Re-take assessment?
        </span>
        <button
          onClick={handleConfirm}
          className="rounded px-2 py-1 text-xs font-medium transition-colors"
          style={{ color: "#f87171" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2d1b1b")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          Confirm
        </button>
        <button
          onClick={handleCancel}
          className="rounded px-2 py-1 text-xs font-medium transition-colors"
          style={{ color: "var(--muted-foreground)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--muted)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleFirstClick}
      className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-white hover:text-black"
      style={{ borderColor: "var(--border)" }}
    >
      Re-take Assessment
    </button>
  );
}