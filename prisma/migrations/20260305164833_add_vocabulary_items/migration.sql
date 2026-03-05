-- CreateTable
CREATE TABLE "vocabulary_items" (
    "id" TEXT NOT NULL,
    "userLanguageId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "exampleSentence" TEXT,
    "sourceConversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocabulary_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vocabulary_items_userLanguageId_idx" ON "vocabulary_items"("userLanguageId");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_items_userLanguageId_word_key" ON "vocabulary_items"("userLanguageId", "word");

-- AddForeignKey
ALTER TABLE "vocabulary_items" ADD CONSTRAINT "vocabulary_items_userLanguageId_fkey" FOREIGN KEY ("userLanguageId") REFERENCES "user_languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_items" ADD CONSTRAINT "vocabulary_items_sourceConversationId_fkey" FOREIGN KEY ("sourceConversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
