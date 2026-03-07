-- AlterTable
ALTER TABLE "vocabulary_items" ADD COLUMN     "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lapses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastReview" TIMESTAMP(3),
ADD COLUMN     "nextReview" TIMESTAMP(3),
ADD COLUMN     "reps" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stability" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "state" TEXT NOT NULL DEFAULT 'NEW';

-- CreateIndex
CREATE INDEX "vocabulary_items_nextReview_idx" ON "vocabulary_items"("nextReview");
