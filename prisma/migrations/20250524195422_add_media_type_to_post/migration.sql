/*
  Warnings:

  - You are about to drop the column `videoId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `videoId` on the `Like` table. All the data in the column will be lost.
  - You are about to drop the `Video` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `postId` on table `Comment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `postId` on table `Like` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_videoId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_videoId_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_authorId_fkey";

-- DropIndex
DROP INDEX "Comment_authorId_videoId_idx";

-- DropIndex
DROP INDEX "Like_userId_videoId_idx";

-- DropIndex
DROP INDEX "Like_userId_videoId_key";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "videoId",
ALTER COLUMN "postId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Like" DROP COLUMN "videoId",
ALTER COLUMN "postId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "mediaType" TEXT;

-- DropTable
DROP TABLE "Video";
