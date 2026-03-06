-- CreateTable
CREATE TABLE "grammar_concepts" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "grammar_concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_grammar_mastery" (
    "id" TEXT NOT NULL,
    "userLanguageId" TEXT NOT NULL,
    "grammarConceptId" TEXT NOT NULL,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_grammar_mastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grammar_errors" (
    "id" TEXT NOT NULL,
    "userLanguageId" TEXT NOT NULL,
    "grammarConceptId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userSentence" TEXT NOT NULL,
    "correction" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grammar_errors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grammar_concepts_language_idx" ON "grammar_concepts"("language");

-- CreateIndex
CREATE UNIQUE INDEX "grammar_concepts_language_name_key" ON "grammar_concepts"("language", "name");

-- CreateIndex
CREATE INDEX "user_grammar_mastery_userLanguageId_idx" ON "user_grammar_mastery"("userLanguageId");

-- CreateIndex
CREATE UNIQUE INDEX "user_grammar_mastery_userLanguageId_grammarConceptId_key" ON "user_grammar_mastery"("userLanguageId", "grammarConceptId");

-- CreateIndex
CREATE INDEX "grammar_errors_userLanguageId_idx" ON "grammar_errors"("userLanguageId");

-- CreateIndex
CREATE INDEX "grammar_errors_conversationId_idx" ON "grammar_errors"("conversationId");

-- AddForeignKey
ALTER TABLE "user_grammar_mastery" ADD CONSTRAINT "user_grammar_mastery_userLanguageId_fkey" FOREIGN KEY ("userLanguageId") REFERENCES "user_languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_grammar_mastery" ADD CONSTRAINT "user_grammar_mastery_grammarConceptId_fkey" FOREIGN KEY ("grammarConceptId") REFERENCES "grammar_concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grammar_errors" ADD CONSTRAINT "grammar_errors_userLanguageId_fkey" FOREIGN KEY ("userLanguageId") REFERENCES "user_languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grammar_errors" ADD CONSTRAINT "grammar_errors_grammarConceptId_fkey" FOREIGN KEY ("grammarConceptId") REFERENCES "grammar_concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grammar_errors" ADD CONSTRAINT "grammar_errors_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
