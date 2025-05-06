/*
  Warnings:

  - Added the required column `last_updated` to the `Products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adapter` to the `Shops` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShopAdapters" AS ENUM ('KPC', 'ZD');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('NORMAL', 'NEXT');

-- AlterTable
ALTER TABLE "JobQueue" ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "Products" ADD COLUMN     "last_updated" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Shops" ADD COLUMN     "adapter" "ShopAdapters" NOT NULL,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Logs_pkey" PRIMARY KEY ("id")
);
