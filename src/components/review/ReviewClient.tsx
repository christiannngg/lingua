"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ReviewQueue, ReviewCard } from "@/app/actions/review";
import { submitReview } from "@/app/actions/review";
import { Rating } from "@/lib/fsrs/types";
import { FlashCard } from "./FlashCard";
import { CompletionScreen } from "./CompletionScreen";
import { LanguageFlag } from "@/components/ui/LanguageFlag";
import { getLanguageDisplayName } from "@/lib/languages.config";

// ─────────────────────────────────────────────────────────────────────────────

interface RatingSummary {
  [Rating.Again]: number;
  [Rating.Hard]: number;
  [Rating.Good]: number;
  [Rating.Easy]: number;
}

function emptyRatingSummary(): RatingSummary {
  return {
    [Rating.Again]: 0,
    [Rating.Hard]: 0,
    [Rating.Good]: 0,
    [Rating.Easy]: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

interface ReviewClientProps {
  queue: ReviewQueue;
  languages: string[];
  currentLang: string;
}

export function ReviewClient({ queue, languages, currentLang }: ReviewClientProps) {
  const router = useRouter();

  // ── Session state ────────────────────────────────────────────────────────
  const [cards] = useState<ReviewCard[]>(queue.cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>(emptyRatingSummary);
  const [done, setDone] = useState(false);

  const [earliestNextReview, setEarliestNextReview] = useState<Date | null>(null);

  // ── AI sentence state ─────────────────────────────────────────────────────
  const [aiSentences, setAiSentences] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const generatedRef = useRef<Set<string>>(new Set());

  // ── Empty queue ──────────────────────────────────────────────────────────
  const isEmpty = cards.length === 0;
  const currentCard = cards[currentIndex];

  // ── Generate sentence on card mount ──────────────────────────────────────
  useEffect(() => {
    if (!currentCard || done || isEmpty) return;
    if (generatedRef.current.has(currentCard.id)) return;

    generatedRef.current.add(currentCard.id);
    setIsGenerating(true);

    fetch("/api/vocabulary/generate-sentence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vocabularyItemId: currentCard.id }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ sentence: string }>;
      })
      .then(({ sentence }) => {
        setAiSentences((prev) => ({ ...prev, [currentCard.id]: sentence }));
      })
      .catch((err) => {
        console.error("[ReviewClient] sentence generation failed:", err);
      })
      .finally(() => {
        setIsGenerating(false);
      });
  }, [currentCard, done, isEmpty]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleRate = useCallback(
    async (rating: Rating) => {
      const card = cards[currentIndex];
      if (!card || submitting) return;

      setSubmitting(true);

      setRatingSummary((prev) => ({
        ...prev,
        [rating]: prev[rating] + 1,
      }));

      const isLast = currentIndex >= cards.length - 1;

      if (isLast) {
        setDone(true);
      } else {
        setCurrentIndex((i) => i + 1);
        setRevealed(false);
      }

      try {
        const result = await submitReview(card.id, rating);
        if (result.success && result.updatedCard.nextReview) {
          const next = new Date(result.updatedCard.nextReview);
          setEarliestNextReview((prev) =>
            prev === null || next < prev ? next : prev
          );
        }
      } catch (err) {
        console.error("[ReviewClient] submitReview failed:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [cards, currentIndex, submitting]
  );

  const handleReviewAgain = useCallback(() => {
    router.refresh();
    setDone(false);
    setCurrentIndex(0);
    setRevealed(false);
    setRatingSummary(emptyRatingSummary());
    setEarliestNextReview(null);
    setAiSentences({});
    generatedRef.current.clear();
  }, [router]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">

      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-6 py-5"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            Review
          </h1>
          <p className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <LanguageFlag language={currentLang} className="w-4 h-auto rounded-sm" />
            {getLanguageDisplayName(currentLang)} · CEFR {queue.cefrLevel}
          </p>
        </div>

        {/* Language switcher */}
        {languages.length > 1 && (
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => router.push(`/dashboard/review?lang=${lang}` as never)}
                className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  borderColor: lang === currentLang ? "var(--color-brand-500)" : "var(--border)",
                  backgroundColor: lang === currentLang ? "var(--color-brand-100)" : "transparent",
                  color: lang === currentLang ? "var(--color-brand-700)" : "var(--muted-foreground)",
                }}
              >
                <LanguageFlag language={lang} className="w-4 h-auto rounded-sm" />
                {getLanguageDisplayName(lang)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">

        {/* Empty queue */}
        {isEmpty && !done && (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">✅</span>
            <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              All caught up!
            </h2>
            <p className="max-w-xs text-sm" style={{ color: "var(--muted-foreground)" }}>
              No words are due for review right now. Keep chatting to build your vocabulary.
            </p>
            <a
              href="/dashboard/vocabulary"
              className="mt-2 rounded-xl border px-6 py-2.5 text-sm font-medium"
              style={{
                borderColor: "var(--color-brand-500)",
                color: "var(--color-brand-500)",
              }}
            >
              View vocabulary
            </a>
          </div>
        )}

        {/* Completion screen */}
        {done && (
          <CompletionScreen
            totalReviewed={currentIndex + 1}
            ratingSummary={ratingSummary}
            nextReviewDate={earliestNextReview}
            onReviewAgain={handleReviewAgain}
            language={currentLang}
          />
        )}

        {/* Active card */}
        {!isEmpty && !done && currentCard && (
          <FlashCard
            card={currentCard}
            revealed={revealed}
            onReveal={handleReveal}
            onRate={handleRate}
            submitting={submitting}
            cardNumber={currentIndex + 1}
            totalCards={cards.length}
            aiSentence={aiSentences[currentCard.id] ?? null}
            isGenerating={isGenerating}
          />
        )}
      </div>
    </div>
  );
}