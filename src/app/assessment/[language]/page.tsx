"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Language = "es" | "it";

const LANGUAGE_NAMES: Record<Language, string> = {
  es: "Spanish",
  it: "Italian",
};

const PERSONA_NAMES: Record<Language, string> = {
  es: "Sofia",
  it: "Marco",
};

export default function AssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const language = params.language as Language;

  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [result, setResult] = useState<{
    cefrLevel: string;
    cefrDescription: string;
  } | null>(null);
  const [userLanguageId, setUserLanguageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // const hasInitialized = useRef(false);

  // Fetch the userLanguageId on mount, then kick off the opening question
  useEffect(() => {
    //  if (hasInitialized.current) return;
      // hasInitialized.current = true;
    async function init() {
      try {
        const res = await fetch(`/api/assessment/init?language=${language}`);
        if (!res.ok) throw new Error("Failed to initialize assessment");
        const data = await res.json();

        // If already assessed, skip straight to dashboard
        if (data.assessmentCompleted) {
          router.replace("/dashboard");
          return;
        }

        setUserLanguageId(data.userLanguageId);
        await sendMessage([], data.userLanguageId);
      } catch {
        setError("Something went wrong starting your assessment. Please try again.");
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(currentMessages: Message[], ulid?: string) {
    const id = ulid ?? userLanguageId;
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/assessment/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          userLanguageId: id,
          messages: currentMessages,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setTurnCount((prev) => prev + 1);

      if (data.isComplete) {
        setResult({
          cefrLevel: data.cefrLevel,
          cefrDescription: data.cefrDescription,
        });
      }
    } catch {
      setError("Failed to get a response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    const trimmed = userInput.trim();
    if (!trimmed || isLoading || result) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setUserInput("");
    await sendMessage(updatedMessages);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const persona = PERSONA_NAMES[language] ?? "Your tutor";
  const languageName = LANGUAGE_NAMES[language] ?? language;

  // ── Result screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
        <h1>Assessment Complete</h1>
        <p>Here's where you're starting with {languageName}:</p>

        <div
          style={{
            border: "2px solid #000",
            borderRadius: 8,
            padding: "1.5rem",
            margin: "1.5rem 0",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", fontWeight: "bold" }}>
            {result.cefrLevel}
          </div>
          <p style={{ marginTop: "0.5rem" }}>{result.cefrDescription}</p>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          style={{ padding: "0.75rem 1.5rem", cursor: "pointer" }}
        >
          Start Learning →
        </button>
      </main>
    );
  }

  // ── Chat screen ────────────────────────────────────────────────────────────
  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      <h1>Level Assessment</h1>
      <p>
        {persona} will ask you a few questions in {languageName} to find the
        right starting point for you.
      </p>
      <p style={{ color: "#666", fontSize: "0.875rem" }}>
        Turn {turnCount} of 5-8
      </p>

      {/* Message thread */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: "1rem",
          minHeight: 300,
          maxHeight: 500,
          overflowY: "auto",
          margin: "1rem 0",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "#000" : "#f0f0f0",
              color: msg.role === "user" ? "#fff" : "#000",
              borderRadius: 8,
              padding: "0.5rem 0.75rem",
              maxWidth: "80%",
            }}
          >
            {msg.content}
          </div>
        ))}

        {isLoading && (
          <div
            style={{
              alignSelf: "flex-start",
              color: "#999",
              fontStyle: "italic",
            }}
          >
            {persona} is typing…
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your response… (Enter to send)"
          disabled={isLoading || !!result}
          rows={2}
          style={{ flex: 1, resize: "none", padding: "0.5rem", borderRadius: 6 }}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !userInput.trim() || !!result}
          style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
        >
          Send
        </button>
      </div>
    </main>
  );
}