"use client";

import { useState } from "react";
import { removeUserLanguage } from "@/app/actions/languages";
import { useRouter } from "next/navigation";

interface Props {
  language: string;
  isOnly: boolean;
}

export function RemoveLanguageButton({ language, isOnly }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isOnly) {
    return (
      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        Can&apos;t remove your only language
      </span>
    );
  }

  function handleFirstClick() {
    setConfirming(true);
    setError(null);
  }

  function handleCancel() {
    setConfirming(false);
    setError(null);
  }

  async function handleConfirm() {
    setIsPending(true);
    setError(null);

    const result = await removeUserLanguage(language);

    if (!result.success) {
      setError(result.error);
      setIsPending(false);
      setConfirming(false);
      return;
    }

    router.refresh();
  }

  if (isPending) {
    return (
      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        Removing…
      </span>
    );
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Remove this language?
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
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleFirstClick}
        className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-red-950 hover:border-red-800 hover:text-red-400"
        style={{ borderColor: "var(--border)" }}
      >
        Remove
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}