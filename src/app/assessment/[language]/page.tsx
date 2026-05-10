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
      <h1>Level Assessment</h1>
      <p>
        {personaName} will ask you a few questions in {languageName} to find the right
        starting point for you.
      </p>
      <p style={{ color: "#666", fontSize: "0.875rem" }}>Turn {turnCount} of 5–8</p>

      <AssessmentMessageThread
        messages={messages}
        isLoading={isLoading}
        error={error}
        personaName={personaName}
      />

      <AssessmentChatInput
        value={userInput}
        onChange={setUserInput}
        onSubmit={handleSubmit}
        disabled={isLoading || !!result}
      />
    </main>
  );
}