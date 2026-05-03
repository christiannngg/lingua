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
      minHeight: "calc(100vh - 85px)",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",  // pushes label to bottom
        maxWidth: "1200px",
        width: "100%",
        paddingTop: "40px",
      }}>

        {/* ── Main row: text + lightbulb side by side ── */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "40px",
        }}>

          {/* Left: text content */}
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
              patterns, and recalls past conversations so you&apos;re never starting from scratch.
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

          {/* Right: lightbulb */}
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

        {/* ── Bottom label — pinned to bottom of viewport ── */}
        <div style={{ paddingBottom: "24px" }}>
          <p style={{
            fontSize: "14px",
            color: "#6b6a84",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            margin: 0,
          }}>
            Languages supported
          </p>
        </div>

      </div>
    </div>
  );
}