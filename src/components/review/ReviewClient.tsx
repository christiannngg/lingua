"use client";

import { useState, useCallback } from "react";
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

  // ── Sentence cache ───────────────────────────────────────────────────────
  const [cardSentences, setCardSentences] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      queue.cards
        .filter((c) => c.exampleSentence !== null)
        .map((c) => [c.id, c.exampleSentence as string]),
    ),
  );

  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());

  // ── Derived ───────────────────────────────────────────────────────────────
  const isEmpty = cards.length === 0;
  const currentCard = cards[currentIndex];

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
          setEarliestNextReview((prev) => (prev === null || next < prev ? next : prev));
        }
      } catch (err) {
        console.error("[ReviewClient] submitReview failed:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [cards, currentIndex, submitting],
  );

  const handleRegenerate = useCallback(
    async (cardId: string) => {
      if (regeneratingIds.has(cardId)) return;

      setRegeneratingIds((prev) => new Set(prev).add(cardId));

      try {
        const res = await fetch("/api/vocabulary/generate-sentence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vocabularyItemId: cardId }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const { sentence } = (await res.json()) as { sentence: string };
        setCardSentences((prev) => ({ ...prev, [cardId]: sentence }));
      } catch (err) {
        console.error("[ReviewClient] regenerate failed:", err);
      } finally {
        setRegeneratingIds((prev) => {
          const next = new Set(prev);
          next.delete(cardId);
          return next;
        });
      }
    },
    [regeneratingIds],
  );

  const handleReviewAgain = useCallback(() => {
    router.refresh();
    setDone(false);
    setCurrentIndex(0);
    setRevealed(false);
    setRatingSummary(emptyRatingSummary());
    setEarliestNextReview(null);
  }, [router]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {/* Header — matches dashboard section headers */}
      <div className="flex items-center justify-between  px-8 py-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            Review
          </h1>
          <p
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            <LanguageFlag language={currentLang} className="w-4 h-auto rounded-sm" />
            {getLanguageDisplayName(currentLang)}
            <span style={{ opacity: 0.4 }}>·</span>
            CEFR {queue.cefrLevel}
          </p>
        </div>

        {/* Language switcher — pill buttons matching dashboard */}
        {languages.length > 1 && (
          <div className="flex gap-2">
            {languages.map((lang) => {
              const isActive = lang === currentLang;
              return (
                <button
                  key={lang}
                  onClick={() => router.push(`/dashboard/review?lang=${lang}` as never)}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150"
                  style={{
                    borderColor: isActive ? "var(--color-brand-500)" : "rgba(202,125,249,0.2)",
                    backgroundColor: isActive ? "rgba(202,125,249,0.1)" : "white",
                    color: isActive ? "var(--color-brand-500)" : "var(--muted-foreground)",
                    boxShadow: isActive ? "0 0 0 1px var(--color-brand-500)" : "none",
                  }}
                >
                  <LanguageFlag language={lang} className="w-4 h-auto rounded-sm" />
                  {getLanguageDisplayName(lang)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        {/* Empty state */}
        {isEmpty && !done && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-4xl"
              style={{
                background: "linear-gradient(135deg, rgba(202,125,249,0.15), rgba(168,85,247,0.1))",
                border: "1px solid rgba(202,125,249,0.2)",
              }}
            >
              ✅
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                All caught up!
              </h2>
              <p className="mt-1 max-w-xs text-sm" style={{ color: "var(--muted-foreground)" }}>
                No words are due for review right now. Keep chatting to build your vocabulary.
              </p>
            </div>
            <a
              href="/dashboard/vocabulary"
              className="mt-1 rounded-xl px-7 py-2.5 text-sm font-semibold transition-all duration-150"
              style={{
                background: "linear-gradient(135deg, #CA7DF9, #a855f7)",
                color: "white",
                boxShadow: "0 4px 14px rgba(202,125,249,0.35)",
              }}
            >
              View vocabulary
            </a>
          </div>
        )}

        {/* Completion */}
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
            onRegenerate={handleRegenerate}
            submitting={submitting}
            isRegenerating={regeneratingIds.has(currentCard.id)}
            cardNumber={currentIndex + 1}
            totalCards={cards.length}
            sentence={cardSentences[currentCard.id] ?? null}
          />
        )}
      </div>
    </div>
  );
}
