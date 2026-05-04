"use client";

import { useInView } from "./features/useInView";
import { SpotlightCard } from "./features/SpotlightCard";
import { SupportingGrid } from "./features/SupportingGrid";
import { SPOTLIGHT_FEATURE, GRID_FEATURES } from "./features/data";

export default function AppFeatures() {
  const spotlight = useInView(0.1);
  const grid = useInView(0.05);

  return (
    <section
      style={{
        background: "#F7F7FF",
        overflow: "hidden",
        fontFamily: "'DIN Round Pro', 'DINRoundPro', system-ui, sans-serif",
      }}
    >
      <SectionHeader />

      <SpotlightCard
        feature={SPOTLIGHT_FEATURE}
        visible={spotlight.visible}
        containerRef={spotlight.ref}
      />

      <SupportingGrid
        features={GRID_FEATURES}
        visible={grid.visible}
        containerRef={grid.ref}
      />
    </section>
  );
}

// Section header

function SectionHeader() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "96px 24px 72px",
        maxWidth: "680px",
        margin: "0 auto",
      }}
    >
      <h2
        style={{
          fontSize: "clamp(2rem, 4vw, 3rem)",
          fontWeight: 700,
          color: "#020122",
          margin: "0 0 20px",
          lineHeight: "1.1",
          letterSpacing: "-0.04em",
        }}
      >
        Enhance your language aquisition.
      </h2>
      <p
        style={{
          fontSize: "17px",
          color: "#6b6a84",
          lineHeight: "1.7",
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        Lingua combines conversational AI, persistent memory, and scientific review
        into a single coherent learning experience.
      </p>
    </div>
  );
}