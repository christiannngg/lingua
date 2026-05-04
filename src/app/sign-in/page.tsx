"use client";

import { signInAction } from "../actions/auth";
import { useAuthForm } from "@/components/auth/useAuthForm";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";

export default function SignInPage() {
  const { error, pending, handleSubmit } = useAuthForm(signInAction);

  return (
    <main
      style={{
        background: "#F7F7FF",
        minHeight: "100vh",
        width: "100%",
        fontFamily: "'DIN Round Pro', 'DINRoundPro', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <AuthCard
        heading="Welcome back"
        footerText="New to Lingua?"
        footerLinkLabel="Create an account"
        footerLinkHref="/sign-up"
      >
        <AuthErrorBanner message={error} />
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AuthInput
            id="email"
            name="email"
            label="Email Address"
            type="email"
            placeholder="Enter your email address"
            required
          />
          <AuthInput
            id="password"
            name="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            required
            minLength={8}
          />
          <AuthSubmitButton pending={pending} label="Sign In" pendingLabel="Signing in…" />
        </form>
      </AuthCard>
    </main>
  );
}