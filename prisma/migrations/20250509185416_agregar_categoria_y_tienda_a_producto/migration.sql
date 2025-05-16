/*
  Warnings:

  - Added the required column `categoria_id` to the `Products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tienda_id` to the `Products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Products" ADD COLUMN     "categoria_id" BIGINT NOT NULL,
ADD COLUMN     "tienda_id" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "Categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_tienda_id_fkey" FOREIGN KEY ("tienda_id") REFERENCES "Shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
