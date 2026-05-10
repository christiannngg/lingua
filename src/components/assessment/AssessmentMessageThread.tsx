"use client";

import { useEffect, useRef } from "react";
import type { Message } from "./types";

interface Props {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  personaName: string;
}

export function AssessmentMessageThread({ messages, isLoading, error, personaName }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div
      style={{
        minHeight: 300,
        maxHeight: 500,
        overflowY: "auto",
        margin: "1rem 0",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
      className="shadow-md rounded-xl bg-white p-4"
    >
      {messages.map((msg, i) => (
        <div
          key={i}
          style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            background: msg.role === "user" ? "#000" : "white",
            color: msg.role === "user" ? "#fff" : "#000",
            padding: "0.5rem 0.75rem",
            maxWidth: "80%",
          }}
          className="white-bg shadow-md border-xl"
        >
          {msg.content}
        </div>
      ))}

      {isLoading && (
        <div style={{ alignSelf: "flex-start", color: "#999", fontStyle: "italic" }}>
          {personaName} is typing…
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div ref={bottomRef} />
    </div>
  );
}