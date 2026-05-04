"use client";

import { signUpAction } from "../actions/auth";
import { useAuthForm } from "@/components/auth/useAuthForm";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { SPOTLIGHT_FEATURE } from "@/components/hero/features/data";
import { LanguageGrid } from "@/components/ui/LanguageGrid";

export default function SignUpPage() {
  const { error, pending, handleSubmit } = useAuthForm(signUpAction);

  return (
    <main
      style={{
        background: "#F7F7FF",
        minHeight: "100vh",
        width: "100%",
        fontFamily: "'DIN Round Pro', 'DINRoundPro', system-ui, sans-serif",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      {/* ── Left: Sign-up form ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 32px",
          background: "#F7F7FF",
        }}
      >
        <AuthCard
          heading="Create your account"
          footerText="Already have an account?"
          footerLinkLabel="Sign in"
          footerLinkHref="/sign-in"
        >
          <AuthErrorBanner message={error} />
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <AuthInput
              id="name"
              name="name"
              label="Username"
              type="text"
              placeholder="Enter your username"
              required
            />
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
            <AuthSubmitButton
              pending={pending}
              label="Create Account"
              pendingLabel="Creating account…"
            />
          </form>
        </AuthCard>
      </div>

      {/* ── Right: Marketing panel ── */}
      <div
        style={{
          background: "#e8e7f4",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px 72px",
          gap: "24px",
        }}
      >
        {/* Eyebrow */}
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#CA7DF9",
          }}
        >
          {SPOTLIGHT_FEATURE.eyebrow}
        </span>

        {/* Title */}
        <h2
          style={{
            fontSize: "clamp(1.8rem, 2.8vw, 2.4rem)",
            fontWeight: 700,
            color: "#000000",
            margin: 0,
            lineHeight: "1.15",
            letterSpacing: "-0.035em",
          }}
        >
          {SPOTLIGHT_FEATURE.title}
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: "15px",
            color: "rgba(0, 0, 0, 0.55)",
            lineHeight: "1.75",
            margin: 0,
          }}
        >
          {SPOTLIGHT_FEATURE.description}
        </p>

        {/* Bullets */}
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {SPOTLIGHT_FEATURE.bullets.map((bullet, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "14px",
                color: "rgba(0, 0, 0, 0.8)",
              }}
            >
              <span
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "rgba(202,125,249,0.15)",
                  border: "1px solid rgba(202,125,249,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "10px",
                  color: "#CA7DF9",
                }}
              >
                ✓
              </span>
              {bullet}
            </li>
          ))}
        </ul>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.08)",
            margin: "8px 0",
          }}
        />

        {/* Languages section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <span
            style={{
              fontSize: "14px",
              letterSpacing: "0.05em",
              color: "rgb(0, 0, 0)",
            }}
          >
            Supporting 9 languages
          </span>
          <LanguageGrid />
        </div>
      </div>
    </main>
  );
}