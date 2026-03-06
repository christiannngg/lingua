-- CreateTable
CREATE TABLE "conversation_embeddings" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "embedding" vector(512) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_embeddings_conversationId_key" ON "conversation_embeddings"("conversationId");

-- AddForeignKey
ALTER TABLE "conversation_embeddings" ADD CONSTRAINT "conversation_embeddings_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
