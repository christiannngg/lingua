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
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isOnly) {
    return (
      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        Can&apos;t remove your only language
      </span>
    );
  }

  async function handleRemove() {
    setIsPending(true);
    setError(null);

    const result = await removeUserLanguage(language);

    if (!result.success) {
      setError(result.error);
      setIsPending(false);
      return;
    }

    // Refresh server component data without a full page reload
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleRemove}
        disabled={isPending}
        className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-red-950 hover:border-red-800 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ borderColor: "var(--border)" }}
      >
        {isPending ? "Removing…" : "Remove"}
      </button>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}