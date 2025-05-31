/*
  Warnings:

  - You are about to drop the column `found_results` on the `GetCategoryProductsTelemetry` table. All the data in the column will be lost.
  - Added the required column `result_count` to the `GetCategoryProductsTelemetry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GetCategoryProductsTelemetry" DROP COLUMN "found_results",
ADD COLUMN     "result_count" INTEGER NOT NULL;
