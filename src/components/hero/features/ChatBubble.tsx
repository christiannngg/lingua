import type { ChatMessage } from "./data";

interface ChatBubbleProps {
  msg: ChatMessage;
  index: number;
  visible: boolean;
}

export function ChatBubble({ msg, index, visible }: ChatBubbleProps) {
  const isAI = msg.from === "ai";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isAI ? "flex-start" : "flex-end",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 0.45s ease ${0.6 + index * 0.18}s, transform 0.45s ease ${0.6 + index * 0.18}s`,
      }}
    >
      <div
        style={{
          maxWidth: "82%",
          padding: "10px 14px",
          borderRadius: isAI ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
          background: isAI ? "white" : "#CA7DF9",
          color: isAI ? "#020122" : "white",
          fontSize: "13px",
          lineHeight: "1.55",
          border: isAI ? "1px solid rgba(2,1,34,0.08)" : "none",
          boxShadow: isAI
            ? "0 1px 4px rgba(2,1,34,0.06)"
            : "0 2px 8px rgba(202,125,249,0.25)",
          letterSpacing: "-0.1px",
        }}
      >
        {msg.text}
      </div>
    </div>
  );
}