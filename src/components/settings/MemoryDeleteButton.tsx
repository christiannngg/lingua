"use client";

import { useState, useTransition } from "react";
import { deleteMemory } from "@/app/actions/memory";

interface MemoryDeleteButtonProps {
  embeddingId: string;
}

export function MemoryDeleteButton({ embeddingId }: MemoryDeleteButtonProps) {
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
      await deleteMemory(embeddingId);
    });
  }

  if (isPending) {
    return (
      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        Deleting...
      </span>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Remove this memory?
        </span>
        <button
          onClick={handleConfirm}
          className="rounded px-2 py-1 text-xs font-medium transition-colors"
          style={{ color: "#f87171" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2d1b1b")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          Remove
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
      className="rounded px-2 py-1 text-xs font-medium transition-colors"
      style={{ color: "var(--muted-foreground)" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
    >
      Forget
    </button>
  );
}