/*
  Warnings:

  - You are about to drop the column `type` on the `Prices` table. All the data in the column will be lost.
  - Added the required column `root_url_id` to the `JobQueue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `producto_id` to the `Prices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JobQueue" ADD COLUMN     "root_url_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Prices" DROP COLUMN "type",
ADD COLUMN     "producto_id" BIGINT NOT NULL;

-- CreateTable
CREATE TABLE "Images" (
    "id" BIGSERIAL NOT NULL,
    "scraped_url" TEXT NOT NULL,
    "cdn_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "producto_id" BIGINT NOT NULL,

    CONSTRAINT "Images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobQueue" ADD CONSTRAINT "JobQueue_root_url_id_fkey" FOREIGN KEY ("root_url_id") REFERENCES "RootUrls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Images" ADD CONSTRAINT "Images_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prices" ADD CONSTRAINT "Prices_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
