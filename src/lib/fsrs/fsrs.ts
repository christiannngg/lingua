// ─────────────────────────────────────────────────────────────────────────────
// FSRS-5 Core Algorithm
// Pure functions only — no side effects, no DB calls, no framework imports.
// Every function takes explicit inputs and returns new values.
// ─────────────────────────────────────────────────────────────────────────────

import {
  CardSchedule,
  CardState,
  FSRSConfig,
  Rating,
  ScheduleResult,
} from "./types";
import {
  DEFAULT_DESIRED_RETENTION,
  DIFFICULTY_MAX,
  DIFFICULTY_MIN,
  FSRS5_DEFAULT_WEIGHTS,
  FSRS_DECAY,
  FSRS_FACTOR,
  MIN_INTERVAL_DAYS,
} from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clamp a value between min and max (inclusive).
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Forgetting curve — retrievability R at time t (days) given stability S.
 *
 *   R(t, S) = (1 + FACTOR * t / S) ^ DECAY
 *
 * Returns a value between 0 and 1. R = 0.9 exactly when t = S (by construction).
 * Returns 1.0 when t = 0 (just reviewed).
 */
function retrievability(t: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + FSRS_FACTOR * (t / stability), FSRS_DECAY);
}

/**
 * Days elapsed since a past date, relative to `now`.
 * Returns 0 if lastReview is null (card has never been reviewed).
 */
function daysSince(lastReview: Date | null, now: Date): number {
  if (!lastReview) return 0;
  return Math.max(0, (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Compute the next review interval in days from a target stability S.
 *
 *   interval = S * ln(desiredRetention) / ln(0.9)
 *
 * The formula scales the S-based interval up or down depending on whether
 * desiredRetention is above or below the 90% baseline baked into FSRS.
 * Result is rounded to a whole number and clamped to MIN_INTERVAL_DAYS.
 */
function intervalFromStability(
  stability: number,
  desiredRetention: number
): number {
  const raw = stability * (Math.log(desiredRetention) / Math.log(0.9));
  return Math.max(MIN_INTERVAL_DAYS, Math.round(raw));
}

/**
 * Extract all 20 FSRS weights from the array into named locals.
 * This is the single place that touches weights[n] — every other function
 * receives plain `number` parameters, sidestepping noUncheckedIndexedAccess.
 */
function unpackWeights(w: readonly number[]): {
  w0: number; w1: number; w2: number; w3: number;
  w4: number; w5: number; w6: number; w7: number;
  w8: number; w9: number; w10: number; w11: number;
  w12: number; w13: number; w14: number; w15: number;
  w16: number; w17: number; w18: number; w19: number;
} {
  // We own the weights array shape (20 elements, validated by FSRS_WEIGHTS_COUNT).
  // Non-null assertion here is intentional and safe — if the array is shorter
  // than 20 elements the algorithm would produce NaN, not a crash.
  return {
    w0:  w[0]  ?? 0, w1:  w[1]  ?? 0, w2:  w[2]  ?? 0, w3:  w[3]  ?? 0,
    w4:  w[4]  ?? 0, w5:  w[5]  ?? 0, w6:  w[6]  ?? 0, w7:  w[7]  ?? 0,
    w8:  w[8]  ?? 0, w9:  w[9]  ?? 0, w10: w[10] ?? 0, w11: w[11] ?? 0,
    w12: w[12] ?? 0, w13: w[13] ?? 0, w14: w[14] ?? 0, w15: w[15] ?? 0,
    w16: w[16] ?? 0, w17: w[17] ?? 0, w18: w[18] ?? 0, w19: w[19] ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Difficulty functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initial difficulty for a brand-new card, based on the first rating.
 *
 *   D0(rating) = w4 - exp(w5 * (rating - 1)) + 1
 *
 * Higher ratings -> lower (easier) difficulty.
 */
function initDifficulty(rating: Rating, w4: number, w5: number): number {
  const d = w4 - Math.exp(w5 * (rating - 1)) + 1;
  return clamp(d, DIFFICULTY_MIN, DIFFICULTY_MAX);
}

/**
 * Updated difficulty after a review, with mean reversion toward D0(Good).
 *
 * Simplified combined form (as in the reference implementation):
 *   D' = w6 * D0(Good) + (1 - w6) * (D - w5 * (rating - 3))
 *
 * This keeps difficulty from drifting too far from the population baseline.
 */
function nextDifficulty(
  D: number,
  rating: Rating,
  w4: number,
  w5: number,
  w6: number,
): number {
  const d0Good = initDifficulty(Rating.Good, w4, w5);
  const d = w6 * d0Good + (1 - w6) * (D - w5 * (rating - 3));
  return clamp(d, DIFFICULTY_MIN, DIFFICULTY_MAX);
}

// ─────────────────────────────────────────────────────────────────────────────
// Stability functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initial stability for a brand-new card, based on the first rating.
 * Each rating maps directly to one of w0–w3.
 *
 *   S0(rating) = w[rating - 1]
 */
function initStability(rating: Rating, w0: number, w1: number, w2: number, w3: number): number {
  const s = rating === Rating.Again ? w0
          : rating === Rating.Hard  ? w1
          : rating === Rating.Good  ? w2
          : w3; // Easy
  return Math.max(MIN_INTERVAL_DAYS, s);
}

/**
 * Stability after a successful review in the Review state (long-term memory).
 *
 *   S_r = S * (e^w7 * (11 - D) * S^(-w9) * (e^(w10*(1-R)) - 1) * hard_penalty * easy_bonus + 1)
 *
 * - Hard penalty:  w11 multiplier applied when rating = Hard
 * - Easy bonus:    w12 multiplier applied when rating = Easy
 * - R is current retrievability at review time
 */
function reviewStability(
  D: number,
  S: number,
  R: number,
  rating: Rating,
  w7: number,
  w9: number,
  w10: number,
  w11: number,
  w12: number,
): number {
  const hardPenalty = rating === Rating.Hard ? w11 : 1;
  const easyBonus   = rating === Rating.Easy ? w12 : 1;

  const newS =
    S *
    (Math.exp(w7) *
      (11 - D) *
      Math.pow(S, -w9) *
      (Math.exp(w10 * (1 - R)) - 1) *
      hardPenalty *
      easyBonus +
      1);

  return Math.max(MIN_INTERVAL_DAYS, newS);
}

/**
 * Stability for Learning and Relearning states (short-term memory).
 * Used when a card hasn't yet graduated to full Review scheduling.
 *
 *   S_st = w13 * D^(-w16) * ((S+1)^w15 - 1) * e^(w14*(1-rating/4))
 *
 * Note: higher rating = better recall = more stability.
 */
function shortTermStability(
  D: number,
  S: number,
  rating: Rating,
  w13: number,
  w14: number,
  w15: number,
  w16: number,
): number {
  const newS =
    w13 *
    Math.pow(D, -w16) *
    (Math.pow(S + 1, w15) - 1) *
    Math.exp(w14 * (1 - rating / 4));

  return Math.max(MIN_INTERVAL_DAYS, newS);
}

/**
 * Stability after a lapse (Again rating on a Review card).
 * The card moves to Relearning and stability drops sharply.
 *
 *   S_lapse = w17 * D^(-w19) * ((S+1)^w18 - 1 + 1)
 */
function lapseStability(
  D: number,
  S: number,
  lapses: number,
  w17: number,
  w18: number,
  w19: number,
): number {
  // lapses parameter kept for future custom weight training; w18=0 in defaults
  void lapses;
  const newS = w17 * Math.pow(D, -w19) * (Math.pow(S + 1, w18) - 1 + 1);
  return Math.max(MIN_INTERVAL_DAYS, newS);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a blank CardSchedule for a brand-new card.
 * Use this when inserting a VocabularyItem for the first time.
 */
export function createNewCard(): CardSchedule {
  return {
    state: CardState.New,
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    lastReview: null,
    nextReview: null,
  };
}

/**
 * Process a review and return the updated CardSchedule + scheduling metadata.
 *
 * This is the single entry point for all FSRS scheduling logic.
 * It is a pure function — call it, persist the returned `card`, done.
 *
 * @param card    Current card state (from DB)
 * @param rating  User's rating for this review
 * @param now     Timestamp of the review (defaults to current time)
 * @param config  Optional overrides for desiredRetention and weights
 */
export function schedule(
  card: CardSchedule,
  rating: Rating,
  now: Date = new Date(),
  config: Partial<FSRSConfig> = {}
): ScheduleResult {
  const rawWeights = config.weights ?? FSRS5_DEFAULT_WEIGHTS;
  const desiredRetention = config.desiredRetention ?? DEFAULT_DESIRED_RETENTION;

  // Unpack once — all subsequent calls receive plain `number` args
  const { w0, w1, w2, w3, w4, w5, w6, w7, w9, w10, w11, w12, w13, w14, w15, w16, w17, w18, w19 } =
    unpackWeights(rawWeights);

  const t = daysSince(card.lastReview, now);
  const R = card.state === CardState.New ? 1 : retrievability(t, card.stability);

  let newStability: number;
  let newDifficulty: number;
  let newState: CardState;
  let newLapses = card.lapses;

  // ── Step 1: Compute new stability and difficulty ──────────────────────────

  if (card.state === CardState.New) {
    // First-ever review: initialise S and D from rating
    newStability  = initStability(rating, w0, w1, w2, w3);
    newDifficulty = initDifficulty(rating, w4, w5);
    newState      = CardState.Learning;
  } else if (
    card.state === CardState.Learning ||
    card.state === CardState.Relearning
  ) {
    // Short-term: card hasn't yet stabilised into long-term memory
    newDifficulty = nextDifficulty(card.difficulty, rating, w4, w5, w6);

    if (rating === Rating.Again) {
      // Still struggling — keep in Learning/Relearning with reset stability
      newStability = initStability(rating, w0, w1, w2, w3);
      newState     = card.state; // stay in same state
    } else {
      // Any positive rating — compute short-term stability growth
      newStability = shortTermStability(card.difficulty, card.stability, rating, w13, w14, w15, w16);
      // Graduate to Review on Good or Easy; stay in Learning on Hard
      newState = rating >= Rating.Good ? CardState.Review : CardState.Learning;
    }
  } else {
    // card.state === CardState.Review
    newDifficulty = nextDifficulty(card.difficulty, rating, w4, w5, w6);

    if (rating === Rating.Again) {
      // Lapse — card forgotten, move to Relearning
      newLapses    = card.lapses + 1;
      newStability = lapseStability(card.difficulty, card.stability, newLapses, w17, w18, w19);
      newState     = CardState.Relearning;
    } else {
      // Successful recall — grow stability using long-term formula
      newStability = reviewStability(card.difficulty, card.stability, R, rating, w7, w9, w10, w11, w12);
      newState     = CardState.Review;
    }
  }

  // ── Step 2: Compute interval ──────────────────────────────────────────────

  let interval: number;

  if (newState === CardState.Learning || newState === CardState.Relearning) {
    // Short-interval states: 1 day until we check again
    interval = MIN_INTERVAL_DAYS;
  } else {
    // Review state: use FSRS interval formula
    interval = intervalFromStability(newStability, desiredRetention);
  }

  // ── Step 3: Build next review date ───────────────────────────────────────

  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);

  // ── Step 4: Return updated card ───────────────────────────────────────────

  const updatedCard: CardSchedule = {
    state:      newState,
    stability:  newStability,
    difficulty: newDifficulty,
    reps:       card.reps + 1,
    lapses:     newLapses,
    lastReview: now,
    nextReview,
  };

  return {
    card:          updatedCard,
    interval,
    retrievability: R,
  };
}