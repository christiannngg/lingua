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
      <span className="text-xs text-slate-400 italic">Can&apos;t remove your only language</span>
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
      <span className="text-xs text-slate-400 italic">Removing…</span>
    );
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2">
          <button
            onClick={handleConfirm}
            className="rounded-lg px-3 py-1.5 text-xs font-medium bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
          >
            Remove
          </button>
          <button
            onClick={handleCancel}
            className="rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleFirstClick}
        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 border border-slate-200 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
      >
        Remove
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}