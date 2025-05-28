/*
  Warnings:

  - You are about to drop the column `cdn_url` on the `Images` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Images" DROP COLUMN "cdn_url",
ADD COLUMN     "bucket" INTEGER;
