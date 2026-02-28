-- CreateTable
CREATE TABLE "assessment_history" (
    "id" TEXT NOT NULL,
    "userLanguageId" TEXT NOT NULL,
    "cefrLevel" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "assessment_history" ADD CONSTRAINT "assessment_history_userLanguageId_fkey" FOREIGN KEY ("userLanguageId") REFERENCES "user_languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
