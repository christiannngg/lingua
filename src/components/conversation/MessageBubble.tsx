// src/components/conversation/MessageBubble.tsx
import type { UIMessage } from "ai";

interface MessageBubbleProps {
  message: UIMessage;
  personaName: string;
}
export function MessageBubble({ message, personaName }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "0.75rem",
        alignItems: "flex-end",
        gap: "0.5rem",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: "1.875rem",
            height: "1.875rem",
            borderRadius: "9999px",
            backgroundColor: "#F3E8FF",
            border: "1px solid #e9d5ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#CA7DF9",
            fontSize: "0.75rem",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {personaName[0]}
        </div>
      )}

      <div
        style={{
          maxWidth: "70%",
          padding: "0.625rem 1rem",
          borderRadius: isUser ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
          backgroundColor: isUser ? "#CA7DF9" : "#FFFFFF",
          color: isUser ? "white" : "#020122",
          fontSize: "0.9375rem",
          lineHeight: "1.6",
          border: isUser ? "none" : "1px solid #f1f5f9",
          boxShadow: isUser ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {message.parts
          .filter((part) => part.type === "text")
          .map((part, i) => (
            <span key={i}>{part.type === "text" ? part.text : null}</span>
          ))}
      </div>
    </div>
  );
}