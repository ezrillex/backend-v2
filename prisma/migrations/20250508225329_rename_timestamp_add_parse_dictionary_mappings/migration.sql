/*
  Warnings:

  - You are about to drop the column `timestamp` on the `Logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Logs"
RENAME COLUMN "timestamp" TO "created_at";

-- CreateTable
CREATE TABLE "ParseDictionary" (
    "id" BIGSERIAL NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParseDictionary_pkey" PRIMARY KEY ("id")
);
