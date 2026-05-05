/**
 * ratelimit.ts
 *
 * Shared Upstash Redis rate limiters for all AI-backed and expensive routes.
 * All limits are per authenticated user (keyed by session.user.id).
 *
 * Limiter summary:
 *  - chatLimiter:       20 requests / 60 s    POST /api/chat
 *  - extractLimiter:    20 requests / 60 s    POST /api/vocabulary/extract (1:1 with chat)
 *  - assessmentLimiter: 10 requests / 3600 s  POST /api/assessment/message, GET /api/assessment/init
 *  - sentenceLimiter:   30 requests / 3600 s  POST /api/vocabulary/generate-sentence
 *  - reembedLimiter:     5 requests / 3600 s  POST /api/embeddings/re-embed
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// ── Startup validation ────────────────────────────────────────────────────
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  throw new Error(
    "[ratelimit] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set. " +
    "Add them to your .env file locally and to Vercel environment variables in production."
  );
}

// ── Redis client — single instance shared across all limiters ─────────────
const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL,
  token: UPSTASH_REDIS_REST_TOKEN,
});

// ── Limiters ──────────────────────────────────────────────────────────────

/**
 * Chat limiter — 20 requests per 60 seconds per user.
 * Applied to POST /api/chat.
 */
export const chatLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  prefix: "lingua:rl:chat",
  analytics: false,
});

/**
 * Extract limiter — 20 requests per 60 seconds per user.
 * Applied to POST /api/vocabulary/extract.
 * Mirrors chatLimiter since extract fires 1:1 with chat turns.
 */
export const extractLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  prefix: "lingua:rl:extract",
  analytics: false,
});

/**
 * Assessment limiter — 10 requests per hour per user.
 * Applied to POST /api/assessment/message and GET /api/assessment/init.
 */
export const assessmentLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "3600 s"),
  prefix: "lingua:rl:assessment",
  analytics: false,
});

/**
 * Sentence generation limiter — 30 requests per hour per user.
 * Applied to POST /api/vocabulary/generate-sentence.
 * Generous enough for a full review session with manual regeneration.
 */
export const sentenceLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "3600 s"),
  prefix: "lingua:rl:sentence",
  analytics: false,
});

/**
 * Re-embed limiter — 5 requests per hour per user.
 * Applied to POST /api/embeddings/re-embed.
 * This is a maintenance operation — strict limit is intentional.
 */
export const reembedLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "3600 s"),
  prefix: "lingua:rl:reembed",
  analytics: false,
});

export const weeklySummaryLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "3600 s"),
  prefix: "lingua:rl:weekly-summary",
  analytics: false,
});