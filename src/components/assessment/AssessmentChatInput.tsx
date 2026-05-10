"use client";

import { ArrowUp } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function AssessmentChatInput({ value, onChange, onSubmit, disabled }: Props) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "0.5rem",
        backgroundColor: "#FFFFFF",
        // padding: "0.875rem 1rem",
      }}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your response…"
        disabled={disabled}
        rows={2}
        style={{
          flex: 1,
          resize: "none",
          maxHeight: "45px",
          borderRadius: "0.75rem",
          border: "1px solid #e2e8f0",
          backgroundColor: "#F7F7FF",
          color: "#020122",
          fontSize: "0.9375rem",
          padding: "0.625rem 1rem",
          outline: "none",
          opacity: disabled ? 0.5 : 1,
          fontFamily: "inherit",
          lineHeight: "1.5",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => {
          (e.target as HTMLTextAreaElement).style.borderColor = "#CA7DF9";
        }}
        onBlur={(e) => {
          (e.target as HTMLTextAreaElement).style.borderColor = "#e2e8f0";
        }}
      />
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        style={{
          width: "9%",
          height: "45px",
          borderRadius: "50%",
          backgroundColor: "#CA7DF9",
          color: "white",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "opacity 0.15s",
          cursor: "pointer"
        }}
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
}