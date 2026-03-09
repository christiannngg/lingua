"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { getPersonaName } from "@/lib/ai/conversation-prompt";
import type { SupportedLanguage } from "@/lib/ai/assessment-schema";
import type { UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface ChatInterfaceProps {
  language: SupportedLanguage;
  cefrLevel: string;
  userLanguageId: string;
  initialConversationId?: string | null;
  initialMessages?: UIMessage[];
}

const TIMEOUT_MS = 30_000;

// Detect whether a useChat error is a timeout/abort
function isTimeoutError(err: Error): boolean {
  return (
    err.name === "AbortError" ||
    err.message.toLowerCase().includes("timeout") ||
    err.message.toLowerCase().includes("aborted")
  );
}

export function ChatInterface({
  language,
  cefrLevel,
  userLanguageId,
  initialConversationId = null,
  initialMessages = [],
}: ChatInterfaceProps) {
  const personaName = getPersonaName(language);
  const bottomRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(initialConversationId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserTextRef = useRef<string>("");
  const router = useRouter();
  const isOnline = useOnlineStatus();

  // null = no error, "timeout" = LLM timed out, "generic" = other failure
  const [errorKind, setErrorKind] = useState<"timeout" | "generic" | null>(null);

  const welcomeMessage: UIMessage = {
    id: "welcome",
    role: "assistant",
    parts: [
      {
        type: "text",
        text:
          language === "es"
            ? `¡Hola! Soy Sofia. ¿De qué quieres hablar hoy?`
            : `Ciao! Sono Marco. Di cosa vuoi parlare oggi?`,
      },
    ],
    metadata: undefined,
  };

  const startingMessages: UIMessage[] =
    initialMessages.length > 0 ? initialMessages : [welcomeMessage];

  const { messages, sendMessage, status } = useChat({
    messages: startingMessages,
    onError: (err) => {
      console.error("[ChatInterface] useChat error:", err);
      clearTimeout(timeoutRef.current ?? undefined);
      setErrorKind(isTimeoutError(err) ? "timeout" : "generic");
    },
    onFinish: () => {
      clearTimeout(timeoutRef.current ?? undefined);
      setErrorKind(null);
      router.refresh();
    },
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { language, userLanguageId },
      fetch: async (url, options) => {
        // Inject the current conversationId into the request body
        if (options?.body) {
          const body = JSON.parse(options.body as string);
          body.conversationId = conversationIdRef.current;
          options = { ...options, body: JSON.stringify(body) };
        }

        // Create a fresh AbortController for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Start the timeout — abort if the stream hasn't finished in TIMEOUT_MS
        timeoutRef.current = setTimeout(() => {
          controller.abort();
        }, TIMEOUT_MS);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        const newConvId = response.headers.get("X-Conversation-Id");
        if (newConvId && !conversationIdRef.current) {
          conversationIdRef.current = newConvId;
        }

        return response;
      },
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current ?? undefined);
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, errorKind]);

  function handleSubmit(text: string) {
    lastUserTextRef.current = text;
    setErrorKind(null);
    void sendMessage({ text });
  }

  function handleRetry() {
    const text = lastUserTextRef.current;
    if (!text) return;
    setErrorKind(null);
    void sendMessage({ text });
  }

  const inputDisabled = isLoading || !isOnline;
  const inputPlaceholder = !isOnline ? "You're offline…" : `Message ${personaName}...`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#0d0d1a",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid #2d2d44",
          backgroundColor: "#13131f",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "9999px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontSize: "1rem",
          }}
        >
          {personaName[0]}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: "#e2e8f0", fontSize: "0.9375rem" }}>
            {personaName}
          </p>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#6366f1" }}>
            {language === "es" ? "Spanish" : "Italian"} · {cefrLevel}
          </p>
        </div>
        {isLoading && (
          <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#64748b" }}>
            {personaName} is typing…
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
        {messages.map((message: UIMessage) => (
          <MessageBubble key={message.id} message={message} personaName={personaName} />
        ))}

        {/* Timeout error — show retry button */}
        {errorKind === "timeout" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              marginTop: "0.5rem",
              backgroundColor: "#1e1e2e",
              borderRadius: "0.5rem",
              border: "1px solid #44334a",
            }}
          >
            <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
              {personaName} took too long to respond.
            </span>
            <button
              onClick={handleRetry}
              style={{
                marginLeft: "1rem",
                padding: "0.375rem 0.875rem",
                borderRadius: "0.5rem",
                backgroundColor: "#6366f1",
                color: "white",
                fontSize: "0.8125rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Generic error — no retry button since we don't know if resubmit is safe */}
        {errorKind === "generic" && (
          <div
            style={{
              textAlign: "center",
              padding: "0.75rem",
              color: "#f87171",
              fontSize: "0.875rem",
              backgroundColor: "#1e1e2e",
              borderRadius: "0.5rem",
              border: "1px solid #7f1d1d",
              marginTop: "0.5rem",
            }}
          >
            Something went wrong. Please try again.
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <ChatInput onSubmit={handleSubmit} isLoading={inputDisabled} placeholder={inputPlaceholder} />
    </div>
  );
}
