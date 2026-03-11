/*
  Warnings:

  - A unique constraint covering the columns `[userLanguageId,lemma]` on the table `vocabulary_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lemma` to the `vocabulary_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "vocabulary_items_userLanguageId_word_key";

-- AlterTable
ALTER TABLE "vocabulary_items" ADD COLUMN     "lemma" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_items_userLanguageId_lemma_key" ON "vocabulary_items"("userLanguageId", "lemma");
