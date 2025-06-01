-- CreateTable
CREATE TABLE "BarkVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "barkId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarkVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BarkVote_userId_barkId_key" ON "BarkVote"("userId", "barkId");

-- AddForeignKey
ALTER TABLE "BarkVote" ADD CONSTRAINT "BarkVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarkVote" ADD CONSTRAINT "BarkVote_barkId_fkey" FOREIGN KEY ("barkId") REFERENCES "Bark"("id") ON DELETE CASCADE ON UPDATE CASCADE;
