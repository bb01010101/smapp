-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('REGULAR', 'PRODUCT', 'SERVICE');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "affiliateCode" TEXT,
ADD COLUMN     "affiliateLink" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "condition" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isAffiliate" BOOLEAN,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "priceType" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "type" "PostType" NOT NULL DEFAULT 'REGULAR';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;
