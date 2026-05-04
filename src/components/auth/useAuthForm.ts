"use client";

import { useState } from "react";
import type { AuthActionResult } from "@/app/actions/auth";

type AuthAction = (formData: FormData) => Promise<AuthActionResult>;

export function useAuthForm(action: AuthAction) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await action(formData);
    setPending(false);
    if (!result.success) {
      setError(result.error);
    }
  }

  return { error, pending, handleSubmit };
}