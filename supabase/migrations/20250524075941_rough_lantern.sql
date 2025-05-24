/*
  # Add Video model for PawPlays feature
  
  1. New Tables
    - `videos`
      - `id` (string, primary key)
      - `title` (string)
      - `url` (string)
      - `thumbnail` (string, optional)
      - `authorId` (string, foreign key to users)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
  
  2. Relations
    - Video belongs to User (author)
    - User has many Videos
*/

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Video_authorId_idx" ON "Video"("authorId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;