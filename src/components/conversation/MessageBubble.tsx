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
      }}
    >
      {!isUser && (
        <div
          style={{
            width: "2rem",
            height: "2rem",
            borderRadius: "9999px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "0.75rem",
            fontWeight: 600,
            marginRight: "0.5rem",
            flexShrink: 0,
            alignSelf: "flex-end",
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
          backgroundColor: isUser ? "#6366f1" : "#1e1e2e",
          color: isUser ? "white" : "#e2e8f0",
          fontSize: "0.9375rem",
          lineHeight: "1.6",
          border: isUser ? "none" : "1px solid #2d2d44",
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
