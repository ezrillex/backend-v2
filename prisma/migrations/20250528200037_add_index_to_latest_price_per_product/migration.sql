-- CreateIndex
CREATE INDEX "Prices_producto_id_created_at_idx" ON "Prices"("producto_id", "created_at" DESC);
