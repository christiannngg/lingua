"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getLanguageDisplayName,
  getPersonaNameForLanguage,
  isSupportedLanguage,
} from "@/lib/languages.config";
import { AssessmentResultScreen } from "@/components/assessment/AssessmentResultScreen";
import { AssessmentMessageThread } from "@/components/assessment/AssessmentMessageThread";
import { AssessmentChatInput } from "@/components/assessment/AssessmentChatInput";
import { AssessmentSelfReport } from "@/components/assessment/AssessmentSelfReport";
import type { Message, AssessmentResult, SelfReportBand } from "@/components/assessment/types";

export default function AssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const rawLanguage = params.language as string;

  // Guard — redirect to dashboard if the language param is not supported
  if (!isSupportedLanguage(rawLanguage)) {
    router.replace("/dashboard");
    return null;
  }

  const language = rawLanguage;
  const languageName = getLanguageDisplayName(language);
  const personaName = getPersonaNameForLanguage(language);

  const [selfReportBand, setSelfReportBand] = useState<SelfReportBand | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [userLanguageId, setUserLanguageId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only runs after the user has completed the self-report step
  useEffect(() => {
    if (!selfReportBand) return;

    async function init() {
      try {
        const res = await fetch(`/api/assessment/init?language=${language}`);
        const data = await res.json();

        if (!res.ok) {
          if (data?.code === "LANGUAGE_NOT_ADDED") {
            router.replace("/onboarding");
            return;
          }
          throw new Error(data?.error ?? "Failed to initialize assessment");
        }

        if (data.assessmentCompleted) {
          router.replace("/dashboard");
          return;
        }

        setUserLanguageId(data.userLanguageId);
        setConversationId(data.conversationId)
        // Pass selfReportBand here so the first AI turn is already seeded
        await sendMessage(null, data.userLanguageId, data.conversationId, selfReportBand);
      } catch {
        setError("Something went wrong starting your assessment. Please try again.");
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfReportBand]);

  async function sendMessage(
    userMessageText: string | null,
    ulid?: string,
    convId?: string,
    band?: SelfReportBand | null,
  ) {
    const id = ulid ?? userLanguageId;
    const cid = convId ?? conversationId;
    if (!id || !cid) return;

    const activeBand = band !== undefined ? band : selfReportBand;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/assessment/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          userLanguageId: id,
          conversationId: cid,
          userMessage: userMessageText,
          selfReportBand: activeBand,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();

      const assistantMessage: Message = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, assistantMessage]);
      setTurnCount((prev) => prev + 1);

      if (data.isComplete) {
        setResult({ cefrLevel: data.cefrLevel, cefrDescription: data.cefrDescription });
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
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    await sendMessage(trimmed);
  }

  // Step 1 — Self-report screen (shown before anything else)
  if (!selfReportBand) {
    return (
      <AssessmentSelfReport
        languageName={languageName}
        personaName={personaName}
        onSelect={(band) => setSelfReportBand(band)}
      />
    );
  }

  // Step 3 — Result screen
  if (result) {
    return <AssessmentResultScreen result={result} languageName={languageName} />;
  }

  // Step 2 — Chat assessment
  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "2rem", color: "black" }}>
       <header
        style={{
          borderBottom: "1px solid #EDE9FE",
          backgroundColor: "rgba(247,247,255,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding: "0 1.25rem",
          borderRadius: "0.5rem"
        }}
      >
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            height: "4rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left — title + subtitle */}
          <div>
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: "#CA7DF9",
                margin: 0,
                lineHeight: 1,
              }}
            >
              Level Assessment
            </p>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "#6B7280",
                margin: "0.2rem 0 0",
                lineHeight: 1,
              }}
            >
              {personaName} · {languageName}
            </p>
          </div>
 
          {/* Right — turn badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              backgroundColor: "#F3E8FF",
              border: "1px solid #E9D5FF",
              borderRadius: "9999px",
              padding: "0.3rem 0.75rem",
            }}
          >
            <span
              style={{
                width: "0.5rem",
                height: "0.5rem",
                borderRadius: "50%",
                backgroundColor: "#CA7DF9",
                display: "inline-block",
                animation: "assessPulse 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#CA7DF9",
              }}
            >
              Turn {turnCount} of 5–8
            </span>
          </div>
        </div>
 
        {/* Progress bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            backgroundColor: "#EDE9FE",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min((turnCount / 8) * 100, 100)}%`,
              backgroundColor: "#CA7DF9",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </header>


      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.5rem 1.25rem",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <AssessmentMessageThread
            messages={messages}
            isLoading={isLoading}
            error={error}
            personaName={personaName}
          />
        </div>
      </div>

      <AssessmentChatInput
        value={userInput}
        onChange={setUserInput}
        onSubmit={handleSubmit}
        disabled={isLoading || !!result}
      />
    </main>
  );
}