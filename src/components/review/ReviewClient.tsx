"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ReviewQueue, ReviewCard } from "@/app/actions/review";
import { submitReview } from "@/app/actions/review";
import { Rating } from "@/lib/fsrs/types";
import { FlashCard } from "./FlashCard";
import { CompletionScreen } from "./CompletionScreen";

// ─────────────────────────────────────────────────────────────────────────────

const LANGUAGE_LABELS: Record<string, string> = {
  es: "🇪🇸 Spanish",
  it: "🇮🇹 Italian",
};

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

  // Earliest nextReview across all cards — used on completion screen
  const [earliestNextReview, setEarliestNextReview] = useState<Date | null>(null);

  // ── Empty queue ──────────────────────────────────────────────────────────
  const isEmpty = cards.length === 0;

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleRate = useCallback(
    async (rating: Rating) => {
      const card = cards[currentIndex];
      if (!card || submitting) return;

      setSubmitting(true);

      // Advance UI immediately — don't wait for the DB write
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

      // DB write happens after UI has already moved on
      try {
        const result = await submitReview(card.id, rating);
        if (result.success && result.updatedCard.nextReview) {
          const next = new Date(result.updatedCard.nextReview);
          setEarliestNextReview((prev) =>
            prev === null || next < prev ? next : prev
          );
        }
      } catch (err) {
        // Silent failure — the user has already moved on
        console.error("[ReviewClient] submitReview failed:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [cards, currentIndex, submitting]
  );

  const handleReviewAgain = useCallback(() => {
    // Reload the page to get a fresh queue from the server
    router.refresh();
    setDone(false);
    setCurrentIndex(0);
    setRevealed(false);
    setRatingSummary(emptyRatingSummary());
    setEarliestNextReview(null);
  }, [router]);

  // ── Current card ─────────────────────────────────────────────────────────
  const currentCard = cards[currentIndex];

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
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {LANGUAGE_LABELS[currentLang] ?? currentLang} · CEFR {queue.cefrLevel}
          </p>
        </div>

        {/* Language switcher */}
        {languages.length > 1 && (
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => router.push(`/dashboard/review?lang=${lang}` as never)}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  borderColor: lang === currentLang ? "var(--color-brand-500)" : "var(--border)",
                  backgroundColor: lang === currentLang ? "var(--color-brand-100)" : "transparent",
                  color: lang === currentLang ? "var(--color-brand-700)" : "var(--muted-foreground)",
                }}
              >
                {LANGUAGE_LABELS[lang] ?? lang}
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
          />
        )}
      </div>
    </div>
  );
}