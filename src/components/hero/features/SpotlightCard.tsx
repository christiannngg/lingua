import { Brain } from "lucide-react";
import { ChatBubble } from "./ChatBubble";
import type { SpotlightFeature } from "./data";
import IT from "country-flag-icons/react/3x2/IT";

interface SpotlightCardProps {
  feature: SpotlightFeature;
  visible: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function SpotlightCard({ feature, visible, containerRef }: SpotlightCardProps) {
  return (
    <div ref={containerRef} style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 80px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderRadius: "24px",
          overflow: "hidden",
          border: "1px solid rgba(2,1,34,0.08)",
          background: "white",
          boxShadow: "0 4px 32px rgba(2,1,34,0.06), 0 1px 4px rgba(2,1,34,0.04)",
        }}
      >
        <SpotlightText feature={feature} visible={visible} />
        <SpotlightVisual feature={feature} visible={visible} />
      </div>
    </div>
  );
}

//  Left panel: text content

function SpotlightText({ feature, visible }: { feature: SpotlightFeature; visible: boolean }) {
  return (
    <div
      style={{
        padding: "56px 52px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "20px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-24px)",
        transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#CA7DF9",
        }}
      >
        {feature.eyebrow}
      </span>

      <h3
        style={{
          fontSize: "clamp(1.6rem, 2.5vw, 2.1rem)",
          fontWeight: 700,
          color: "#020122",
          margin: 0,
          lineHeight: "1.15",
          letterSpacing: "-0.035em",
        }}
      >
        {feature.title}
      </h3>

      <p style={{ fontSize: "15px", color: "#6b6a84", lineHeight: "1.75", margin: 0 }}>
        {feature.description}
      </p>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
        {feature.bullets.map((bullet, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              color: "#020122",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-12px)",
              transition: `opacity 0.4s ease ${0.4 + i * 0.1}s, transform 0.4s ease ${0.4 + i * 0.1}s`,
            }}
          >
            <span
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "rgba(202,125,249,0.1)",
                border: "1px solid rgba(202,125,249,0.35)",
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
    </div>
  );
}

// Right panel: chat visual

function SpotlightVisual({ feature, visible }: { feature: SpotlightFeature; visible: boolean }) {
  return (
    <div
      style={{
        background: "#F7F7FF",
        padding: "48px 40px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        position: "relative",
        borderLeft: "1px solid rgba(2,1,34,0.07)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(24px)",
        transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
      }}
    >
      <TutorHeader />

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {feature.visual.messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} index={i} visible={visible} />
        ))}
      </div>

      <MemoryBadge badge={feature.visual.badge} visible={visible} />
    </div>
  );
}

function TutorHeader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "8px",
        padding: "12px 14px",
        borderRadius: "14px",
        background: "white",
        border: "1px solid rgba(2,1,34,0.07)",
        boxShadow: "0 1px 4px rgba(2,1,34,0.04)",
      }}
    >
      <div
        style={{
          width: "25px",
          height: "25px",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <IT style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#020122" }}>Sofia</div>
        <div style={{ fontSize: "11px", color: "#aaa9be" }}>Italian Tutor</div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "5px" }}>
        <div
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "#4ade80",
            boxShadow: "0 0 5px rgba(74,222,128,0.5)",
          }}
        />
      </div>
    </div>
  );
}

function MemoryBadge({ badge, visible }: { badge: string; visible: boolean }) {
  return (
    <div
      style={{
        marginTop: "8px",
        padding: "9px 14px",
        borderRadius: "10px",
        background: "rgba(202,125,249,0.07)",
        border: "1px solid rgba(202,125,249,0.18)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease 1.2s",
      }}
    >
      <Brain size={20} strokeWidth={1.5} color="#CA7DF9" />
      <span style={{ fontSize: "12px", color: "#000000" }}>{badge}</span>
    </div>
  );
}