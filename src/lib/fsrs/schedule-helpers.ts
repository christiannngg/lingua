import { createNewCard, schedule } from "./fsrs";
import { CardState, Rating } from "./types";

export function toCardSchedule(item: {
  state: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  lastReview: Date | null;
  nextReview: Date | null;
}) {
  // If the card has never been reviewed, treat it as a fresh card
  if (item.state === CardState.New && item.reps === 0) {
    return createNewCard();
  }

  return {
    state: item.state as CardState,
    stability: item.stability,
    difficulty: item.difficulty,
    reps: item.reps,
    lapses: item.lapses,
    lastReview: item.lastReview,
    nextReview: item.nextReview,
  };
}

/**
 * Validate that a rating value from the client is a valid FSRS Rating.
 */
export function isValidRating(value: unknown): value is Rating {
  return (
    typeof value === "number" &&
    [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].includes(value as Rating)
  );
}

/**
 * Returns true if state + reps satisfy the mastered threshold.
 * Mirrors isMastered() in progress.ts — kept local to avoid a cross-action import.
 */
export function isMasteredState(state: string, reps: number): boolean {
  return state === "REVIEW" && reps >= 5;
}