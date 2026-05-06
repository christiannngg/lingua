-- Add masteredAt column (nullable — null means not yet mastered or backfill unavailable)
ALTER TABLE "vocabulary_items" ADD COLUMN IF NOT EXISTS "masteredAt" TIMESTAMP(3);

-- Best-effort backfill: for words already in mastered state, use lastReview
-- as the approximated mastery timestamp. lastReview is the timestamp of the
-- review that caused the transition, making it the closest available proxy.
UPDATE "vocabulary_items"
SET "masteredAt" = "lastReview"
WHERE "state" = 'REVIEW'
  AND "reps" >= 5
  AND "lastReview" IS NOT NULL
  AND "masteredAt" IS NULL;

-- Index to support growth chart queries that bucket mastered words by week
CREATE INDEX IF NOT EXISTS "vocabulary_items_masteredAt_idx" ON "vocabulary_items"("masteredAt");