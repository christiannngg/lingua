"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { getPersonaName } from "@/lib/ai/conversation-prompt";
import { getLanguageDisplayName, type SupportedLanguage } from "@/lib/languages.config";
import type { UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface ChatInterfaceProps {
  language: SupportedLanguage;
  cefrLevel: string;
  userLanguageId: string;
  initialConversationId?: string | null;
  initialMessages?: UIMessage[];
  greetingText?: string | null;
}

const TIMEOUT_MS = 30_000;

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
  greetingText = null,
}: ChatInterfaceProps) {
  const personaName = getPersonaName(language);
  const languageDisplayName = getLanguageDisplayName(language);
  const bottomRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(initialConversationId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserTextRef = useRef<string>("");
  const router = useRouter();
  const isOnline = useOnlineStatus();

  const [errorKind, setErrorKind] = useState<"timeout" | "generic" | null>(null);

  const greetingUIMessage: UIMessage | null = greetingText
    ? {
        id: "greeting-display",
        role: "assistant",
        parts: [{ type: "text", text: greetingText }],
        metadata: undefined,
      }
    : null;

  const startingMessages: UIMessage[] =
    initialMessages.length > 0
      ? initialMessages
      : greetingUIMessage
      ? [greetingUIMessage]
      : [];

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
        if (options?.body) {
          const body = JSON.parse(options.body as string);
          body.conversationId = conversationIdRef.current;
          options = { ...options, body: JSON.stringify(body) };
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

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
        width: "100%",
        height: "100%",
        backgroundColor: "var(--background)",
      }}
    >
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1.25rem" }}>
        {messages.map((message: UIMessage) => (
          <MessageBubble key={message.id} message={message} personaName={personaName} />
        ))}

        {errorKind === "timeout" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              marginTop: "0.5rem",
              backgroundColor: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: "0.75rem",
            }}
          >
            <span style={{ fontSize: "0.875rem", color: "#92400e" }}>
              {personaName} took too long to respond.
            </span>
            <button
              onClick={handleRetry}
              style={{
                marginLeft: "1rem",
                padding: "0.375rem 0.875rem",
                borderRadius: "0.5rem",
                backgroundColor: "#CA7DF9",
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

        {errorKind === "generic" && (
          <div
            style={{
              textAlign: "center",
              padding: "0.75rem",
              color: "#dc2626",
              fontSize: "0.875rem",
              backgroundColor: "#fef2f2",
              borderRadius: "0.75rem",
              border: "1px solid #fecaca",
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