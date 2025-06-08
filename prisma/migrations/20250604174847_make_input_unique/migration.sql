/*
  Warnings:

  - A unique constraint covering the columns `[input]` on the table `Dictionary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Dictionary_input_key" ON "Dictionary"("input");
