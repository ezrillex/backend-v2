-- DropForeignKey
ALTER TABLE "Prices" DROP CONSTRAINT "Prices_producto_id_fkey";

-- AddForeignKey
ALTER TABLE "Prices" ADD CONSTRAINT "Prices_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
