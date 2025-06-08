/*
  Warnings:

  - Made the column `time_taken` on table `GetCategoryProductsTelemetry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `time_taken` on table `GetProductTelemetry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `time_taken` on table `SearchTelemetry` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "GetCategoryProductsTelemetry" ALTER COLUMN "time_taken" SET NOT NULL,
ALTER COLUMN "time_taken" SET DEFAULT -1;

-- AlterTable
ALTER TABLE "GetProductTelemetry" ALTER COLUMN "time_taken" SET NOT NULL,
ALTER COLUMN "time_taken" SET DEFAULT -1;

-- AlterTable
ALTER TABLE "SearchTelemetry" ALTER COLUMN "time_taken" SET NOT NULL,
ALTER COLUMN "time_taken" SET DEFAULT -1;

-- CreateTable
CREATE TABLE "TaskTelemetry" (
    "id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "time_taken" DOUBLE PRECISION NOT NULL DEFAULT -1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTelemetry_pkey" PRIMARY KEY ("id")
);
