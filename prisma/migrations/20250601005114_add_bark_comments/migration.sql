-- CreateTable
CREATE TABLE "BarkComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "barkId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarkComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BarkComment_barkId_idx" ON "BarkComment"("barkId");

-- CreateIndex
CREATE INDEX "BarkComment_parentId_idx" ON "BarkComment"("parentId");

-- AddForeignKey
ALTER TABLE "BarkComment" ADD CONSTRAINT "BarkComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarkComment" ADD CONSTRAINT "BarkComment_barkId_fkey" FOREIGN KEY ("barkId") REFERENCES "Bark"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarkComment" ADD CONSTRAINT "BarkComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BarkComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
