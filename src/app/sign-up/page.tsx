"use client";

import { useState } from "react";
import { signUpAction } from "../actions/auth";
import Link from "next/link";
import Image from "next/image";
import LinguaLogoImage from "../../../public/logo-no-bg.png";
import { SPOTLIGHT_FEATURE } from "@/components/hero/features/data";
import { LanguageGrid } from "@/components/ui/LanguageGrid";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await signUpAction(formData);
    setPending(false);
    if (!result.success) {
      setError(result.error);
    }
  }

  function onFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#CA7DF9";
    e.currentTarget.style.background = "#fff";
  }

  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#e8e7f4";
    e.currentTarget.style.background = "#ffffff";
    e.currentTarget.style.boxShadow = "none";
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    background: "#ffffff",
    border: "1.5px solid #e8e7f4",
    borderRadius: 10,
    padding: "11px 14px",
    fontSize: 14,
    color: "#020122",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: "#020122",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  };

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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "#fff",
            borderRadius: 20,
            border: "1px solid rgba(202,125,249,0.18)",
            padding: "32px 32px 28px",
            width: "100%",
            maxWidth: 440,
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 5,
            }}
          >
            <Image src={LinguaLogoImage} alt="Lingua Logo" />
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#020122",
              letterSpacing: "-0.5px",
              margin: "0 0 40px",
              textAlign: "center",
            }}
          >
            Create your account
          </h1>

          <div style={{ width: "100%" }}>
            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#dc2626",
                  marginBottom: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#dc2626",
                    flexShrink: 0,
                  }}
                />
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {/* Username */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor="name" style={labelStyle}>Username</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your username"
                  required
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor="email" style={labelStyle}>Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  required
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor="password" style={labelStyle}>Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  minLength={8}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={pending}
                style={{
                  marginTop: 4,
                  width: "100%",
                  background: pending ? "#d8a8fb" : "#CA7DF9",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "13px 20px",
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: pending ? "not-allowed" : "pointer",
                  letterSpacing: "-0.1px",
                  transition: "background 0.15s",
                }}
              >
                {pending ? "Creating account…" : "Create Account"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p style={{ marginTop: 24, fontSize: 14, color: "#6b6a84", textAlign: "center" }}>
            {"Already have an account? "}
            <Link
              href="/sign-in"
              style={{ color: "#CA7DF9", fontWeight: 700, textDecoration: "none" }}
            >
              Sign in
            </Link>
          </p>
        </div>
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