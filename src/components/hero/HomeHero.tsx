"use client"
import Link from "next/link";
import RotatingTagline from "@/components/hero/RotatingTagline";
import dynamic from "next/dynamic";

const ParticleOrb = dynamic(() => import("@/components/hero/ParticleOrb"), { ssr: false });

export default function HomeHero() {
  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      
      {/* ── Orb: absolutely positioned, bleeds right ── */}
      <div style={{
        position: "absolute",
        top: "50%",
        right: "100px",          
        transform: "translateY(-50%)",
        zIndex: 0,
        pointerEvents: "none",
        border: "1px solid blue",

      }}>
        <ParticleOrb />
      </div>

      {/* ── Foreground content ── */}
      <div style={{
        zIndex: 1,
        padding: "120px 0px",
        gap: "20px",
        border: "1px solid blue",
        display: "flex",
        flexDirection: "column",
        margin: "0px 300px",
        maxWidth: "625px",
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

        <div style={{ fontSize: "6rem", fontWeight: 700, lineHeight: 1.04, letterSpacing: "-2px" }}>
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
    </div>
  );
}