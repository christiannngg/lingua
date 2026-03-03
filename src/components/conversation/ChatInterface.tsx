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

interface ChatInterfaceProps {
  language: SupportedLanguage;
  cefrLevel: string;
  userLanguageId: string;
  initialConversationId?: string | null;
  initialMessages?: UIMessage[];
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
  const router = useRouter();

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

  const { messages, sendMessage, status, error } = useChat({
    messages: startingMessages,
    onError: (err) => {
      console.error("[ChatInterface] useChat error:", err);
    },
    onFinish: () => {
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
        const response = await fetch(url, options);
        const newConvId = response.headers.get("X-Conversation-Id");
        if (newConvId && !conversationIdRef.current) {
          conversationIdRef.current = newConvId;
        }
        return response;
      },
    }),
  });

  useEffect(() => {
    console.log(
      "[ChatInterface] messages updated:",
      messages.map((m) => ({ role: m.role, parts: m.parts })),
    );
  }, [messages]);
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(text: string) {
    void sendMessage({ text });
  }

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
        {error && (
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

      <ChatInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder={`Message ${personaName}...`}
      />
    </div>
  );
}
