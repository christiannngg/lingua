import type { GridFeature } from "./data";

import { BookOpen, RefreshCw, Target, ScanSearch, BarChart2, Globe } from "lucide-react";

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  "Smart Vocabulary Tracking": <BookOpen size={18} strokeWidth={1.5} color="#CA7DF9" />,
  "Spaced Repetition Reviews": <RefreshCw size={18} strokeWidth={1.5} color="#CA7DF9" />,
  "CEFR Assessment":           <Target    size={18} strokeWidth={1.5} color="#CA7DF9" />,
  "Grammar Insights":          <ScanSearch size={18} strokeWidth={1.5} color="#CA7DF9" />,
  "Progress Dashboard":        <BarChart2  size={18} strokeWidth={1.5} color="#CA7DF9" />,
  "9 Languages":               <Globe     size={18} strokeWidth={1.5} color="#CA7DF9" />,
};

interface SupportingGridProps {
  features: GridFeature[];
  visible: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function SupportingGrid({ features, visible, containerRef }: SupportingGridProps) {
  return (
    <div ref={containerRef} style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 96px" }}>
      <Divider visible={visible} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        {features.map((feature, i) => (
          <FeatureCard key={i} feature={feature} index={i} visible={visible} />
        ))}
      </div>
    </div>
  );
}

// Divider

function Divider({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "40px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease 0.1s",
      }}
    >
      <div style={{ flex: 1, height: "1px", background: "rgba(2,1,34,0.08)" }} />
      <span
        style={{
          fontSize: "12px",
          color: "#aaa9be",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        And more
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(2,1,34,0.08)" }} />
    </div>
  );
}

// Individual feature card 

function FeatureCard({ feature, index, visible }: { feature: GridFeature; index: number; visible: boolean }) {
  return (
    <div
      style={{
        padding: "32px 28px",
        background: "white",
        borderRadius: "18px",
        border: "1px solid rgba(2,1,34,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        cursor: "default",
        boxShadow: "0 1px 4px rgba(2,1,34,0.04)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${0.1 + index * 0.07}s`,
        transitionProperty: "opacity, transform, box-shadow",
        transitionDuration: "0.5s, 0.25s, 0.2s",
        transitionTimingFunction: "ease",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transitionDelay = "0s";
        el.style.boxShadow = "0 8px 32px rgba(202,125,249,0.1), 0 2px 8px rgba(2,1,34,0.05)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transitionDelay = "0s";
        el.style.boxShadow = "0 1px 4px rgba(2,1,34,0.04)";
        el.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "rgba(202,125,249,0.08)",
          border: "1px solid rgba(202,125,249,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          color: "#CA7DF9",
        }}
      >
        {FEATURE_ICONS[feature.title] ?? feature.icon}
      </div>

      <div>
        <h4
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#020122",
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          {feature.title}
        </h4>
        <p
          style={{
            fontSize: "13.5px",
            color: "#7a7896",
            lineHeight: "1.65",
            margin: 0,
          }}
        >
          {feature.description}
        </p>
      </div>
    </div>
  );
}