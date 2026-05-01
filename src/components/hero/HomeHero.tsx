"use client";
import Link from "next/link";
import RotatingTagline from "@/components/hero/RotatingTagline";
import LightbulbOrb from "./LightbulbOrb";

export default function HomeHero() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      width: "100%",
    }}>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: "1200px",
        width: "100%",
        minHeight: "calc(100vh - 84px)",
        gap: "40px",
      }}>

        {/* ── Left: text content ── */}
        <div style={{
          flex: "0 0 auto",
          maxWidth: "580px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}>
          <h1 style={{
            fontSize: "6rem",
            fontWeight: 700,
            lineHeight: 1.04,
            color: "#020122",
            letterSpacing: "-2px",
            margin: 0,
          }}>
            The tutor that
          </h1>

          <div style={{
            fontSize: "6rem",
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: "-2px",
          }}>
            <RotatingTagline />
          </div>

          <p style={{
            fontSize: "1.25rem",
            lineHeight: 1.65,
            color: "#6b6a84",
            maxWidth: "480px",
            fontWeight: 400,
            margin: 0,
          }}>
            Every session builds on the last. Lingua tracks your vocabulary, catches your grammar
            patterns, and recalls past conversations — so you&apos;re never starting from scratch.
          </p>

          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/sign-up" style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "white",
              background: "#CA7DF9",
              padding: "10px 32px",
              borderRadius: "50px",
              textDecoration: "none",
              letterSpacing: "-0.1px",
            }}>
              Get started
            </Link>
          </div>
        </div>

        {/* ── Right: lightbulb ── */}
        <div style={{
          flex: "0 0 auto",
          width: "480px",
          height: "560px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <LightbulbOrb />
        </div>

      </div>
    </div>
  );
}