"use server";

// Next.js Server Actions that bridge forms to the auth engine

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type AuthActionResult = { success: true } | { success: false; error: string };

export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  try {
    await auth.api.signUpEmail({
      body: { email, password, name },
    });
  } catch (err) {
    console.error("[signUpAction] Error:", err);
    const message = err instanceof Error ? err.message : "Sign up failed";
    // Better Auth surfaces "User already exists" style messages in err.message
    return { success: false, error: message };
  }

  redirect("/onboarding" as never);
}

export async function signInAction(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await auth.api.signInEmail({
      body: { email, password },
    });
  } catch (err) {
    console.error("[signInAction] Error:", err);
    return { success: false, error: "Invalid email or password" };
  }

  redirect("/onboarding" as never);
}

export async function signOutAction(): Promise<void> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (err) {
    console.error("[signOutAction] Error:", err);
    // Sign-out failure is non-critical — redirect regardless
  }

  redirect("/");
}
