-- DropForeignKey
ALTER TABLE "grammar_errors" DROP CONSTRAINT "grammar_errors_grammarConceptId_fkey";

-- DropForeignKey
ALTER TABLE "user_grammar_mastery" DROP CONSTRAINT "user_grammar_mastery_grammarConceptId_fkey";

-- AddForeignKey
ALTER TABLE "user_grammar_mastery" ADD CONSTRAINT "user_grammar_mastery_grammarConceptId_fkey" FOREIGN KEY ("grammarConceptId") REFERENCES "grammar_concepts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grammar_errors" ADD CONSTRAINT "grammar_errors_grammarConceptId_fkey" FOREIGN KEY ("grammarConceptId") REFERENCES "grammar_concepts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
