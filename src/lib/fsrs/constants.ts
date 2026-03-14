// ─────────────────────────────────────────────────────────────────────────────
// FSRS-5 Constants
// Published default weights from the FSRS-5 paper.
// Trained on a large dataset of real spaced repetition reviews.
// Source: https://github.com/open-spaced-repetition/fsrs5
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FSRS-5 default weight vector (w0 through w19).
 *
 * Weights control the shape of the stability and difficulty functions.
 * These defaults work well without any user-specific training.
 *
 * Index -> role:
 *   w0–w3   Initial stability for ratings Again / Hard / Good / Easy
 *   w4      Initial difficulty for Good rating (baseline)
 *   w5      Difficulty delta scale
 *   w6      Difficulty mean-reversion strength
 *   w7      Stability growth scale (Review state)
 *   w8      Stability growth: difficulty influence
 *   w9      Stability growth: stability influence (decay)
 *   w10     Stability growth: retrievability influence
 *   w11     Stability growth: Hard penalty multiplier
 *   w12     Stability growth: Easy bonus multiplier
 *   w13     Short-term stability scaling (Learning/Relearning)
 *   w14     Short-term stability: rating influence
 *   w15     Short-term stability: stability influence
 *   w16     Short-term stability: difficulty influence
 *   w17     Lapse stability: base multiplier
 *   w18     Lapse stability: lapses influence
 *   w19     Lapse stability: difficulty influence
 */
export const FSRS5_DEFAULT_WEIGHTS: readonly number[] = [
  0.40255, // w0  — initial stability: Again
  1.18385, // w1  — initial stability: Hard
  3.1262,  // w2  — initial stability: Good
  15.4722, // w3  — initial stability: Easy
  7.2102,  // w4  — initial difficulty for Good
  0.5316,  // w5  — difficulty delta scale
  1.0651,  // w6  — difficulty mean-reversion strength
  0.06069, // w7  — stability growth scale
  1.9395,  // w8  — difficulty influence on stability growth
  0.11,    // w9  — stability decay influence
  1.9,     // w10 — retrievability influence on stability
  0.29605, // w11 — Hard penalty multiplier
  2.2698,  // w12 — Easy bonus multiplier
  0.2315,  // w13 — short-term stability scaling
  0.2704,  // w14 — short-term: rating influence
  0.5,     // w15 — short-term: stability influence
  3.1,     // w16 — short-term: difficulty influence
  0.4072,  // w17 — lapse stability: base multiplier
  0.0,     // w18 — lapse stability: lapses influence
  0.6,     // w19 — lapse stability: difficulty influence
] as const;

/**
 * The decay constant used in the forgetting curve formula.
 * R(t) = (1 + FACTOR * t / S) ^ DECAY
 *
 * DECAY is fixed at -0.5 in FSRS-5.
 * FACTOR is derived from DECAY to normalise the curve to R=0.9 at t=S.
 */
export const FSRS_DECAY = -0.5;
export const FSRS_FACTOR = 19 / 81; // ≈ 0.2346 — derived: (0.9^(1/DECAY) - 1)

/**
 * Default desired retention — the target retrievability at the moment of review.
 * 0.9 means the algorithm aims for a 90% chance the user still remembers the word.
 * Lowering this increases intervals (harder schedule); raising it decreases them.
 */
export const DEFAULT_DESIRED_RETENTION = 0.9;

/**
 * Difficulty is clamped to this range throughout all calculations.
 * Prevents runaway values from distorting scheduling.
 */
export const DIFFICULTY_MIN = 1;
export const DIFFICULTY_MAX = 10;

/**
 * Minimum interval in days.
 * Even if the formula produces a sub-day value, we floor to 1.
 */
export const MIN_INTERVAL_DAYS = 1;

/**
 * The number of FSRS weights expected in a valid weight vector.
 * Used for runtime validation if you ever allow custom weights.
 */
export const FSRS_WEIGHTS_COUNT = 20;