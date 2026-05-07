"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ReviewQueue, ReviewCard } from "@/app/actions/review";
import { Rating } from "@/lib/fsrs/types";
import {
  loadSession,
  saveSession,
  clearSession,
  resolveResumedSession,
} from "@/lib/review-session";
import { FlashCard } from "./FlashCard";
import { CompletionScreen } from "./CompletionScreen";
import { LanguageFlag } from "@/components/ui/LanguageFlag";
import { getLanguageDisplayName } from "@/lib/languages.config";
import { CheckCircleIcon } from "lucide-react";
import { AnimatedPage, AnimatedSection } from "../layout/AnimatedPage";

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

interface ReviewClientProps {
  queue: ReviewQueue;
  languages: string[];
  currentLang: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Session initialisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derives the initial card list, starting index, and session total from the
 * server-provided queue and any saved session in sessionStorage.
 */
function initSessionState(queue: ReviewQueue): {
  cards: ReviewCard[];
  currentIndex: number;
  sessionTotal: number;
} {
  const saved = loadSession(queue.userLanguageId);

  if (!saved) {
    // Fresh session — no prior progress for today
    return {
      cards: queue.cards,
      currentIndex: 0,
      sessionTotal: queue.cards.length,
    };
  }

  // Resumed session — reconstruct remaining cards from the saved ID list
  const { remainingCards, sessionTotal, resumeIndex } = resolveResumedSession(
    saved,
    queue.cards,
  );

  return {
    cards: remainingCards,
    currentIndex: resumeIndex,
    sessionTotal,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ReviewClient({ queue, languages, currentLang }: ReviewClientProps) {
  const router = useRouter();

  // ── Session initialisation ───────────────────────────────────────────────
  const [{ cards, currentIndex: initIndex, sessionTotal: initTotal }] = useState(
    () => initSessionState(queue),
  );

  const [cards_] = useState<ReviewCard[]>(cards);
  const [currentIndex, setCurrentIndex] = useState<number>(initIndex);

  const [sessionTotal] = useState<number>(initTotal);

  const sessionCardIdsRef = useRef<string[]>(
    (() => {
      const saved = loadSession(queue.userLanguageId);
      return saved ? saved.cardIds : queue.cards.map((c) => c.id);
    })(),
  );

  const [revealed, setRevealed] = useState(false);
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>(emptyRatingSummary);
  const [done, setDone] = useState(false);
  const [earliestNextReview, setEarliestNextReview] = useState<Date | null>(null);

  // ── Sentence cache ───────────────────────────────────────────────────────
  const [cardSentences, setCardSentences] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      cards_.
        filter((c) => c.exampleSentence !== null)
        .map((c) => [c.id, c.exampleSentence as string]),
    ),
  );

  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());

  // ── Persist progress to sessionStorage ──────────────────────────────────
  // Runs after every index change. Writes the frozen full cardIds list
  // (from the ref) plus the current index — so the next mount can
  // reconstruct both the session total and the remaining cards correctly.
  useEffect(() => {
    saveSession(
      queue.userLanguageId,
      sessionCardIdsRef.current,
      currentIndex,
    );
  }, [currentIndex, queue.userLanguageId]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const isEmpty = cards_.length === 0;
  const currentCard = cards_[currentIndex];
  const isCurrentCardSubmitting = currentCard
    ? submittingIds.has(currentCard.id)
    : false;

  // cardNumber is the 1-based position in the original session, not just
  // within the current render's card slice.
  // sessionTotal - cards_.length = how many cards were already rated before
  // this mount. Adding currentIndex gives the absolute position.
  const cardNumber = sessionTotal - cards_.length + currentIndex + 1;

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleRate = useCallback(
    async (rating: Rating) => {
      const card = cards_[currentIndex];
      if (!card || submittingIds.has(card.id)) return;

      setSubmittingIds((prev) => new Set(prev).add(card.id));
      setRatingSummary((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

      const isLast = currentIndex >= cards_.length - 1;

      if (isLast) {
        // Session complete — clear saved progress so the next visit is fresh
        clearSession(queue.userLanguageId);
        setDone(true);
      } else {
        setCurrentIndex((i) => i + 1);
        setRevealed(false);

        // Clean up any stale regeneration state for the card we just left
        setRegeneratingIds((prev) => {
          if (!prev.has(card.id)) return prev;
          const next = new Set(prev);
          next.delete(card.id);
          return next;
        });
      }

      try {
        const res = await fetch("/api/vocabulary/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vocabularyItemId: card.id, rating }),
        });

        if (res.ok) {
          const data = await res.json() as {
            success: boolean;
            updatedCard: { nextReview: string | null };
          };
          if (data.success && data.updatedCard.nextReview) {
            const next = new Date(data.updatedCard.nextReview);
            setEarliestNextReview((prev) => (prev === null || next < prev ? next : prev));
          }
        }
      } catch (err) {
        console.error("[ReviewClient] submitReview failed:", err);
      } finally {
        setSubmittingIds((prev) => {
          const next = new Set(prev);
          next.delete(card.id);
          return next;
        });
      }
    },
    [cards_, currentIndex, submittingIds, queue.userLanguageId],
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
    // Clear saved session so the next render starts fresh from the server
    clearSession(queue.userLanguageId);

    setDone(false);
    setCurrentIndex(0);
    setRevealed(false);
    setRatingSummary(() => emptyRatingSummary());
    setEarliestNextReview(null);
    setSubmittingIds(new Set());
    setRegeneratingIds(new Set());

    // Navigate to force a fresh server fetch of the queue
    router.push(`/dashboard/review?lang=${currentLang}` as never);
  }, [router, currentLang, queue.userLanguageId]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <AnimatedPage className="flex h-full flex-col">
      {/* Header */}
      <AnimatedSection>
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "black" }}>
              Review
            </h1>
            <p className="flex items-center gap-1.5 text-sm" style={{ color: "black" }}>
              <LanguageFlag language={currentLang} className="w-4 h-auto rounded-sm" />
              {getLanguageDisplayName(currentLang)}
              <span style={{ opacity: 0.4 }}>·</span>
              CEFR {queue.cefrLevel}
            </p>
          </div>

          {/* Language switcher */}
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
                      color: isActive ? "var(--color-brand-500)" : "black",
                      boxShadow: isActive ? "0 0 0 1px var(--color-brand-500)" : "none",
                      cursor: "pointer",
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
      </AnimatedSection>

      {/* Main content area */}
      <AnimatedSection>
        <div className="flex flex-1 items-center justify-center px-6 py-10">

          {/* Empty state */}
          {isEmpty && !done && (
            <div className="flex flex-col items-center gap-4 text-center mt-50">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full"
                style={{
                  background: "linear-gradient(135deg, rgba(202,125,249,0.15), rgba(168,85,247,0.1))",
                  border: "1px solid rgba(202,125,249,0.2)",
                }}
              >
                <CheckCircleIcon size={32} style={{ color: "var(--color-brand-500)" }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "black" }}>
                  All caught up!
                </h2>
                <p className="mt-1 max-w-xs text-sm" style={{ color: "black" }}>
                  No words are due for review right now. Keep chatting to build your vocabulary.
                </p>
              </div>
              <a
                href="/dashboard/vocabulary"
                className="mt-1 rounded-xl px-7 py-2.5 text-sm font-semibold transition-all duration-150"
                style={{
                  background: "#CA7DF9",
                  color: "white",
                }}
              >
                View vocabulary
              </a>
            </div>
          )}

          {/* Completion screen */}
          {done && (
            <CompletionScreen
              totalReviewed={sessionTotal}
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
              submitting={isCurrentCardSubmitting}
              isRegenerating={regeneratingIds.has(currentCard.id)}
              cardNumber={cardNumber}
              totalCards={sessionTotal}
              sentence={cardSentences[currentCard.id] ?? null}
            />
          )}
        </div>
      </AnimatedSection>
    </AnimatedPage>
  );
}