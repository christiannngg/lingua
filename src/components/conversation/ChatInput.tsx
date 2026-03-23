import { ArrowUp } from "lucide-react";
import { useState, type ChangeEvent, type KeyboardEvent } from "react";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({ onSubmit, isLoading, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
  }

  function handleSend() {
    const text = value.trim();
    if (!text || isLoading) return;
    onSubmit(text);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "0.5rem",
        borderTop: "1px solid #2d2d44",
        backgroundColor: "#13131f",
        padding: "1rem",
      }}
    >
      <textarea
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        placeholder={placeholder ?? "Type a message..."}
        rows={1}
        style={{
          flex: 1,
          resize: "none",
          maxHeight: "120px",
          borderRadius: "0.75rem",
          border: "1px solid #2d2d44",
          backgroundColor: "#1e1e2e",
          color: "#e2e8f0",
          fontSize: "0.9375rem",
          padding: "0.625rem 1rem",
          outline: "none",
          opacity: isLoading ? 0.5 : 1,
          fontFamily: "inherit",
          lineHeight: "1.5",
        }}
      />
      <button
        onClick={handleSend}
        disabled={isLoading || !value.trim()}
        aria-label="Send message"
        style={{
          width: "2.5rem",
          height: "2.5rem",
          borderRadius: "0.75rem",
          backgroundColor: "#6366f1",
          color: "white",
          border: "none",
          cursor: isLoading || !value.trim() ? "not-allowed" : "pointer",
          opacity: isLoading || !value.trim() ? 0.4 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "opacity 0.15s",
        }}
      >
        {isLoading ? (
          <span
            style={{
              width: "1rem",
              height: "1rem",
              borderRadius: "9999px",
              border: "2px solid white",
              borderTopColor: "transparent",
              display: "inline-block",
              animation: "spin 0.6s linear infinite",
            }}
          />
        ) : (
          <div>
            <ArrowUp size={24}></ArrowUp>
          </div>
        )}
      </button>
    </div>
  );
}
