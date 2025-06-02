
-- DropForeignKey
ALTER TABLE "JobQueue" DROP CONSTRAINT "JobQueue_root_url_id_fkey";

-- DropForeignKey
ALTER TABLE "RootUrls" DROP CONSTRAINT "RootUrls_category_id_fkey";

-- DropForeignKey
ALTER TABLE "RootUrls" DROP CONSTRAINT "RootUrls_shop_id_fkey";

-- Renombrar columna root url a sources en job queue.
ALTER TABLE "JobQueue" RENAME COLUMN "root_url_id" TO "source_id";

-- Renombrar la tabla
ALTER TABLE "RootUrls" RENAME TO "Sources";

-- Renombrar la columna
ALTER TABLE "Sources" RENAME COLUMN "url" TO "data";


-- Cambiar tipo de dato y transformar el contenido en JSONB
ALTER TABLE "Sources"
ALTER COLUMN "data" TYPE JSONB
USING jsonb_build_object('url', "data");


-- AddForeignKey
ALTER TABLE "Sources" ADD CONSTRAINT "Sources_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sources" ADD CONSTRAINT "Sources_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobQueue" ADD CONSTRAINT "JobQueue_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "Sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

