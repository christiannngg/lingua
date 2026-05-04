"use client";

import { useState } from "react";
import { signInAction } from "../actions/auth";
import Link from "next/link";
import Image from "next/image";
import LinguaLogoImage from "../../../public/logo-no-bg.png";

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await signInAction(formData);
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
    padding: "11px 44px 11px 14px",
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          borderRadius: 20,
          border: "1px solid rgba(202,125,249,0.18)",
          padding: "32px 32px 28px",
          width: "100%",
          maxWidth: 440,
        }}
      >

        {/* Icon badge */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#fff",
            // border: "1.5px solid rgba(202,125,249,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 5,
          }}
        >

          <Image
            src={LinguaLogoImage}
            alt="Lingua Logo Image"
          />
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
          Welcome back
        </h1>

        <div
          style={{
            width: "100%",
          }}
        >
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
            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="email" style={labelStyle}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
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
            </div>

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

                <label htmlFor="password" style={labelStyle}>
                  Password
                </label>

              </div>
              <div style={{ position: "relative" }}>
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
              {pending ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ marginTop: 24, fontSize: 14, color: "#6b6a84", textAlign: "center" }}>
          {"New to Lingua? "}
          <Link
            href="/sign-up"
            style={{ color: "#CA7DF9", fontWeight: 700, textDecoration: "none" }}
          >
            Create an account
          </Link>
        </p>

      </div>

    </main>
  );
}