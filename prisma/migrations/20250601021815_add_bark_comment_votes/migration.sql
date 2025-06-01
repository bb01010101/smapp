-- CreateTable
CREATE TABLE "BarkCommentVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarkCommentVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BarkCommentVote_userId_commentId_key" ON "BarkCommentVote"("userId", "commentId");

-- AddForeignKey
ALTER TABLE "BarkCommentVote" ADD CONSTRAINT "BarkCommentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarkCommentVote" ADD CONSTRAINT "BarkCommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "BarkComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
