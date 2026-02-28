-- AlterTable
ALTER TABLE "user_languages" ADD COLUMN     "assessmentCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "assessmentStartedAt" TIMESTAMP(3),
ADD COLUMN     "cefrLevel" TEXT NOT NULL DEFAULT 'A1';
