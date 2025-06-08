/*
  Warnings:

  - You are about to drop the `ParseDictionary` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ParseDictionary";

-- CreateTable
CREATE TABLE "Dictionary" (
    "id" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dictionary_pkey" PRIMARY KEY ("id")
);
