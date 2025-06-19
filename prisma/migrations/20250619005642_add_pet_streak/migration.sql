-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "lastDailyPostDate" TIMESTAMP(3),
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0;
