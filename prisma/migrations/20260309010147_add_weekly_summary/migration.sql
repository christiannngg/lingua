-- CreateTable
CREATE TABLE "weekly_summaries" (
    "id" TEXT NOT NULL,
    "userLanguageId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_summaries_userLanguageId_key" ON "weekly_summaries"("userLanguageId");

-- AddForeignKey
ALTER TABLE "weekly_summaries" ADD CONSTRAINT "weekly_summaries_userLanguageId_fkey" FOREIGN KEY ("userLanguageId") REFERENCES "user_languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
