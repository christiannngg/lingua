// ─────────────────────────────────────────────────────────────────────────────
// FSRS Types
// Pure TypeScript — no framework or DB dependencies.
// These types mirror the fields that will be added to VocabularyItem in Prisma.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The four possible ratings a user can give when reviewing a card.
 * Numeric values are required by the FSRS algorithm internals.
 */
export enum Rating {
  Again = 1, // Complete blackout — couldn't recall at all
  Hard = 2,  // Recalled with significant difficulty
  Good = 3,  // Recalled correctly with some effort
  Easy = 4,  // Recalled perfectly with no effort
}

/**
 * The state a card can be in within the FSRS state machine.
 *
 *   New ──► Learning ──► Review
 *                           │
 *                           ▼
 *                       Relearning ──► Review
 *
 * - New:        Never reviewed. No stability or difficulty yet.
 * - Learning:   Recently introduced. Short intervals, building initial stability.
 * - Review:     Graduated card. Longer intervals, full FSRS scheduling active.
 * - Relearning: Lapsed from Review after an Again rating. Rebuilding stability.
 */
export enum CardState {
  New = "NEW",
  Learning = "LEARNING",
  Review = "REVIEW",
  Relearning = "RELEARNING",
}

/**
 * The full FSRS state for a single card.
 * This is what gets persisted to VocabularyItem and passed into schedule().
 *
 * Field mapping to Prisma VocabularyItem (fields to be added via migration):
 *   state       → state        String  @default("NEW")
 *   stability   → stability    Float   @default(0)
 *   difficulty  → difficulty   Float   @default(0)
 *   reps        → reps         Int     @default(0)
 *   lapses      → lapses       Int     @default(0)
 *   lastReview  → lastReview   DateTime?
 *   nextReview  → nextReview   DateTime?
 */
export interface CardSchedule {
  state: CardState;
  stability: number;   // S — days until retrievability drops to 90%
  difficulty: number;  // D — inherent difficulty of the card (1–10 scale)
  reps: number;        // total number of reviews
  lapses: number;      // times the card has lapsed (Again on a Review card)
  lastReview: Date | null;
  nextReview: Date | null;
}

/**
 * The result returned by schedule() after processing a review.
 * Contains the updated card state plus a human-readable interval for debugging/display.
 */
export interface ScheduleResult {
  card: CardSchedule;
  interval: number;         // days until next review (floored to whole days, min 1)
  retrievability: number;   // R at time of review — 0 to 1 (useful for logging/display)
}

/**
 * Optional config passed to the FSRS scheduler.
 * All fields have defaults defined in constants.ts.
 */
export interface FSRSConfig {
  desiredRetention: number; // Target retrievability at review time (default: 0.9)
  weights: number[];        // FSRS-5 weight vector w0–w19 (default: FSRS5_DEFAULT_WEIGHTS)
}