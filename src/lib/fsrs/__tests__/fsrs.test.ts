// ─────────────────────────────────────────────────────────────────────────────
// FSRS Unit Tests
// Run with: npx vitest (or jest, if configured)
// Every public behaviour is covered. No mocking — pure function testing only.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, expect, it } from "vitest";
import { createNewCard, schedule } from "../fsrs";
import { CardState, Rating } from "../types";
import { MIN_INTERVAL_DAYS } from "../constants";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Simulate reviewing a card N days after its last review. */
function reviewAfterDays(
  card: ReturnType<typeof createNewCard>,
  days: number,
  rating: Rating,
  baseDate = new Date("2024-01-01T00:00:00Z")
) {
  const reviewDate = new Date(baseDate);
  reviewDate.setDate(reviewDate.getDate() + days);
  return schedule(card, rating, reviewDate);
}

/** Simulate a sequence of reviews, each on its scheduled nextReview date. */
function simulateReviews(ratings: [Rating, ...Rating[]]): ReturnType<typeof schedule> {
  const [first, ...rest] = ratings;
  let result = schedule(createNewCard(), first, new Date("2024-01-01T00:00:00Z"));
  for (const rating of rest) {
    result = schedule(result.card, rating, result.card.nextReview!);
  }
  return result;
}

// ─── New card initialisation ──────────────────────────────────────────────────

describe("createNewCard", () => {
  it("creates a card in New state with zero values", () => {
    const card = createNewCard();
    expect(card.state).toBe(CardState.New);
    expect(card.stability).toBe(0);
    expect(card.difficulty).toBe(0);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.lastReview).toBeNull();
    expect(card.nextReview).toBeNull();
  });
});

// ─── First review (New → Learning) ───────────────────────────────────────────

describe("First review — New card", () => {
  it("transitions to Learning state on any rating", () => {
    for (const rating of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) {
      const { card } = schedule(createNewCard(), rating);
      expect(card.state).toBe(CardState.Learning);
    }
  });

  it("initialises stability > 0 for all ratings", () => {
    for (const rating of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) {
      const { card } = schedule(createNewCard(), rating);
      expect(card.stability).toBeGreaterThan(0);
    }
  });

  it("initialises difficulty within valid range (1–10) for all ratings", () => {
    for (const rating of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) {
      const { card } = schedule(createNewCard(), rating);
      expect(card.difficulty).toBeGreaterThanOrEqual(1);
      expect(card.difficulty).toBeLessThanOrEqual(10);
    }
  });

  it("Easy produces higher initial stability than Good > Hard > Again", () => {
    const [againS, hardS, goodS, easyS] = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].map(
      (r) => schedule(createNewCard(), r).card.stability
    ) as [number, number, number, number];
    expect(easyS).toBeGreaterThan(goodS);   // Easy > Good
    expect(goodS).toBeGreaterThan(hardS);   // Good > Hard
    expect(hardS).toBeGreaterThan(againS);  // Hard > Again
  });

  it("Easy produces lower initial difficulty than Good > Hard > Again", () => {
    const [againD, hardD, goodD, easyD] = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].map(
      (r) => schedule(createNewCard(), r).card.difficulty
    ) as [number, number, number, number];
    expect(easyD).toBeLessThan(goodD);   // Easy < Good
    expect(goodD).toBeLessThan(hardD);   // Good < Hard
    expect(hardD).toBeLessThan(againD);  // Hard < Again
  });

  it("sets reps to 1 and lastReview to now", () => {
    const now = new Date("2024-06-15T12:00:00Z");
    const { card } = schedule(createNewCard(), Rating.Good, now);
    expect(card.reps).toBe(1);
    expect(card.lastReview).toEqual(now);
  });

  it("returns interval of 1 day (minimum for Learning state)", () => {
    const { interval } = schedule(createNewCard(), Rating.Good);
    expect(interval).toBe(MIN_INTERVAL_DAYS);
  });
});

// ─── Learning state ───────────────────────────────────────────────────────────

describe("Learning state", () => {
  it("stays in Learning on Hard rating", () => {
    const { card: learning } = schedule(createNewCard(), Rating.Good);
    const { card } = schedule(learning, Rating.Hard);
    expect(card.state).toBe(CardState.Learning);
  });

  it("stays in Learning on Again rating", () => {
    const { card: learning } = schedule(createNewCard(), Rating.Good);
    const { card } = schedule(learning, Rating.Again);
    expect(card.state).toBe(CardState.Learning);
  });

  it("graduates to Review on Good rating", () => {
    const { card: learning } = schedule(createNewCard(), Rating.Good);
    const { card } = schedule(learning, Rating.Good);
    expect(card.state).toBe(CardState.Review);
  });

  it("graduates to Review on Easy rating", () => {
    const { card: learning } = schedule(createNewCard(), Rating.Good);
    const { card } = schedule(learning, Rating.Easy);
    expect(card.state).toBe(CardState.Review);
  });

  it("does not increment lapses on Again during Learning", () => {
    const { card: learning } = schedule(createNewCard(), Rating.Good);
    const { card } = schedule(learning, Rating.Again);
    expect(card.lapses).toBe(0);
  });

  it("increments reps on every review", () => {
    let result = schedule(createNewCard(), Rating.Good);
    expect(result.card.reps).toBe(1);
    result = schedule(result.card, Rating.Good);
    expect(result.card.reps).toBe(2);
    result = schedule(result.card, Rating.Good);
    expect(result.card.reps).toBe(3);
  });
});

// ─── Review state ─────────────────────────────────────────────────────────────

describe("Review state", () => {
  /** Helper: graduate a card to Review state via Good + Good path */
  function getReviewCard() {
    const r1 = schedule(createNewCard(), Rating.Good, new Date("2024-01-01T00:00:00Z"));
    const r2 = schedule(r1.card, Rating.Good, r1.card.nextReview!);
    return r2.card;
  }

  it("stays in Review on Good rating", () => {
    const reviewCard = getReviewCard();
    const { card } = schedule(reviewCard, Rating.Good, reviewCard.nextReview!);
    expect(card.state).toBe(CardState.Review);
  });

  it("stays in Review on Hard rating", () => {
    const reviewCard = getReviewCard();
    const { card } = schedule(reviewCard, Rating.Hard, reviewCard.nextReview!);
    expect(card.state).toBe(CardState.Review);
  });

  it("stays in Review on Easy rating", () => {
    const reviewCard = getReviewCard();
    const { card } = schedule(reviewCard, Rating.Easy, reviewCard.nextReview!);
    expect(card.state).toBe(CardState.Review);
  });

  it("moves to Relearning on Again rating", () => {
    const reviewCard = getReviewCard();
    const { card } = schedule(reviewCard, Rating.Again, reviewCard.nextReview!);
    expect(card.state).toBe(CardState.Relearning);
  });

  it("increments lapses on Again in Review state", () => {
    const reviewCard = getReviewCard();
    const { card } = schedule(reviewCard, Rating.Again, reviewCard.nextReview!);
    expect(card.lapses).toBe(1);
  });

  it("does not increment lapses on non-Again ratings", () => {
    const reviewCard = getReviewCard();
    for (const rating of [Rating.Hard, Rating.Good, Rating.Easy]) {
      const { card } = schedule(reviewCard, rating, reviewCard.nextReview!);
      expect(card.lapses).toBe(0);
    }
  });

  it("Easy produces longer interval than Good", () => {
    const reviewCard = getReviewCard();
    const good = schedule(reviewCard, Rating.Good, reviewCard.nextReview!);
    const easy = schedule(reviewCard, Rating.Easy, reviewCard.nextReview!);
    expect(easy.interval).toBeGreaterThan(good.interval);
  });

  it("Hard produces shorter interval than Good", () => {
    const reviewCard = getReviewCard();
    const hard = schedule(reviewCard, Rating.Hard, reviewCard.nextReview!);
    const good = schedule(reviewCard, Rating.Good, reviewCard.nextReview!);
    expect(hard.interval).toBeLessThan(good.interval);
  });

  it("intervals grow across successive Good reviews", () => {
    const intervals: number[] = [];
    let result = schedule(createNewCard(), Rating.Good, new Date("2024-01-01T00:00:00Z"));
    // Graduate to Review
    result = schedule(result.card, Rating.Good, result.card.nextReview!);

    for (let i = 0; i < 5; i++) {
      result = schedule(result.card, Rating.Good, result.card.nextReview!);
      intervals.push(result.interval);
    }

    // Each interval should be >= previous (allowing for rounding on first Review)
    let prev = intervals[0] ?? 0;
    for (const interval of intervals.slice(1)) {
      expect(interval).toBeGreaterThanOrEqual(prev);
      prev = interval;
    }
  });

  it("interval is at least MIN_INTERVAL_DAYS for all ratings", () => {
    const reviewCard = getReviewCard();
    for (const rating of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) {
      const { interval } = schedule(reviewCard, rating, reviewCard.nextReview!);
      expect(interval).toBeGreaterThanOrEqual(MIN_INTERVAL_DAYS);
    }
  });
});

// ─── Relearning state ─────────────────────────────────────────────────────────

describe("Relearning state", () => {
  /** Helper: lapse a Review card to get a Relearning card */
  function getRelearningCard() {
    const r1 = schedule(createNewCard(), Rating.Good, new Date("2024-01-01T00:00:00Z"));
    const r2 = schedule(r1.card, Rating.Good, r1.card.nextReview!);
    const lapse = schedule(r2.card, Rating.Again, r2.card.nextReview!);
    return lapse.card;
  }

  it("stays in Relearning on Again rating", () => {
    const card = getRelearningCard();
    const { card: next } = schedule(card, Rating.Again, card.nextReview!);
    expect(next.state).toBe(CardState.Relearning);
  });

  it("re-graduates to Review on Good rating", () => {
    const card = getRelearningCard();
    const { card: next } = schedule(card, Rating.Good, card.nextReview!);
    expect(next.state).toBe(CardState.Review);
  });

  it("re-graduates to Review on Easy rating", () => {
    const card = getRelearningCard();
    const { card: next } = schedule(card, Rating.Easy, card.nextReview!);
    expect(next.state).toBe(CardState.Review);
  });

  it("does not increment lapses further on Again in Relearning", () => {
    const card = getRelearningCard(); // already has 1 lapse
    const { card: next } = schedule(card, Rating.Again, card.nextReview!);
    expect(next.lapses).toBe(1); // lapses only increment on Review → Relearning transition
  });

  it("stability after lapse is lower than before lapse", () => {
    // Need a mature Review card with high stability so the lapse has room to drop it.
    // Graduate via Good+Good, then do several more Good reviews to build stability.
    let result = schedule(createNewCard(), Rating.Good, new Date("2024-01-01T00:00:00Z"));
    result = schedule(result.card, Rating.Good, result.card.nextReview!); // → Review
    result = schedule(result.card, Rating.Good, result.card.nextReview!);
    result = schedule(result.card, Rating.Good, result.card.nextReview!);
    result = schedule(result.card, Rating.Good, result.card.nextReview!);
    const stabilityBeforeLapse = result.card.stability;
    const lapse = schedule(result.card, Rating.Again, result.card.nextReview!);
    expect(lapse.card.stability).toBeLessThan(stabilityBeforeLapse);
  });
});

// ─── retrievability ───────────────────────────────────────────────────────────

describe("ScheduleResult retrievability", () => {
  it("is 1 for a brand new card (never reviewed)", () => {
    const { retrievability: R } = schedule(createNewCard(), Rating.Good);
    expect(R).toBe(1);
  });

  it("decreases as time since last review increases", () => {
    const base = createNewCard();
    const r1 = schedule(base, Rating.Good, new Date("2024-01-01T00:00:00Z"));
    // Graduate to Review
    const r2 = schedule(r1.card, Rating.Good, r1.card.nextReview!);

    const earlyReview = schedule(r2.card, Rating.Good, r2.card.nextReview!);
    const lateReview = reviewAfterDays(r2.card, r2.interval * 3, Rating.Good);

    expect(lateReview.retrievability).toBeLessThan(earlyReview.retrievability);
  });

  it("is between 0 and 1 for all states", () => {
    const results = simulateReviews([
      Rating.Good,
      Rating.Good,
      Rating.Good,
      Rating.Again,
      Rating.Good,
    ]);
    // Just sanity check the final retrievability
    expect(results.retrievability).toBeGreaterThanOrEqual(0);
    expect(results.retrievability).toBeLessThanOrEqual(1);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("Edge cases", () => {
  it("handles multiple lapses — lapses counter accumulates correctly", () => {
    let result = simulateReviews([Rating.Good, Rating.Good]);
    // Lapse twice
    result = schedule(result.card, Rating.Again, result.card.nextReview!);
    result = schedule(result.card, Rating.Good, result.card.nextReview!); // re-graduate
    result = schedule(result.card, Rating.Again, result.card.nextReview!);
    expect(result.card.lapses).toBe(2);
  });

  it("nextReview is always in the future relative to lastReview", () => {
    const [first, ...rest] = [Rating.Good, Rating.Good, Rating.Good, Rating.Easy] as const;
    let result = schedule(createNewCard(), first, new Date("2024-01-01T00:00:00Z"));
    for (const step of rest) {
      result = schedule(result.card, step, result.card.nextReview!);
      expect(result.card.nextReview!.getTime()).toBeGreaterThan(
        result.card.lastReview!.getTime()
      );
    }
  });

  it("difficulty stays within 1–10 across a long review sequence", () => {
    // Alternate between Again and Easy to stress-test difficulty clamping
    const ratings = Array.from({ length: 20 }, (_, i) =>
      i % 2 === 0 ? Rating.Again : Rating.Easy
    ) as [Rating, ...Rating[]];
    const result = simulateReviews(ratings);
    expect(result.card.difficulty).toBeGreaterThanOrEqual(1);
    expect(result.card.difficulty).toBeLessThanOrEqual(10);
  });

  it("custom desiredRetention 0.95 produces shorter intervals than default 0.9", () => {
    const reviewCard = (() => {
      const r1 = schedule(createNewCard(), Rating.Good, new Date("2024-01-01T00:00:00Z"));
      return schedule(r1.card, Rating.Good, r1.card.nextReview!).card;
    })();

    const defaultResult = schedule(reviewCard, Rating.Good, reviewCard.nextReview!);
    const strictResult = schedule(reviewCard, Rating.Good, reviewCard.nextReview!, {
      desiredRetention: 0.95,
    });

    expect(strictResult.interval).toBeLessThan(defaultResult.interval);
  });

  it("reps counter always increases monotonically", () => {
    let result = schedule(createNewCard(), Rating.Good, new Date("2024-01-01T00:00:00Z"));
    let prevReps = result.card.reps;
    for (const rating of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) {
      result = schedule(result.card, rating, result.card.nextReview!);
      expect(result.card.reps).toBeGreaterThan(prevReps);
      prevReps = result.card.reps;
    }
  });
});