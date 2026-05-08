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
        backgroundColor: "#FFFFFF",
        padding: "0.875rem 1rem",
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
          border: "1px solid #e2e8f0",
          backgroundColor: "#F7F7FF",
          color: "#020122",
          fontSize: "0.9375rem",
          padding: "0.625rem 1rem",
          outline: "none",
          opacity: isLoading ? 0.5 : 1,
          fontFamily: "inherit",
          lineHeight: "1.5",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "#CA7DF9"; }}
        onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "#e2e8f0"; }}
      />
      <button
        onClick={handleSend}
        disabled={isLoading || !value.trim()}
        aria-label="Send message"
        style={{
          width: "2.5rem",
          height: "2.5rem",
          borderRadius: "0.75rem",
          backgroundColor: "#CA7DF9",
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
          <ArrowUp size={18} />
        )}
      </button>
    </div>
  );
}
