/*
  Warnings:

  - A unique constraint covering the columns `[fingerprint]` on the table `Products` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Products_fingerprint_key" ON "Products"("fingerprint");
