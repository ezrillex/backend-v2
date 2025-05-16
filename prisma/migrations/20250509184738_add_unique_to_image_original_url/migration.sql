/*
  Warnings:

  - A unique constraint covering the columns `[scraped_url]` on the table `Images` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Images_scraped_url_key" ON "Images"("scraped_url");
