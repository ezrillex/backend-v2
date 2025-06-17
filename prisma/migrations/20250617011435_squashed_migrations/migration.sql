-- CreateEnum
CREATE TYPE "ShopAdapters" AS ENUM ('KPC', 'ZD');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAIL');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('PRODUCT', 'PAGE', 'NEXT_PAGE');

-- CreateTable
CREATE TABLE "Shops" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adapter" "ShopAdapters" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sources" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "category_id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobQueue" (
    "id" TEXT NOT NULL,
    "job_data" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL,
    "source_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "JobQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" TEXT,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Products" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria_id" TEXT NOT NULL,
    "tienda_id" TEXT NOT NULL,
    "keywords" TEXT,

    CONSTRAINT "Products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Images" (
    "id" TEXT NOT NULL,
    "scraped_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "producto_id" TEXT NOT NULL,
    "bucket" INTEGER,

    CONSTRAINT "Images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prices" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "producto_id" TEXT NOT NULL,

    CONSTRAINT "Prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dictionary" (
    "id" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dictionary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchTelemetry" (
    "id" TEXT NOT NULL,
    "search" TEXT NOT NULL,
    "result_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_taken" DOUBLE PRECISION DEFAULT -1,
    "time_taken_flexsearch" DOUBLE PRECISION DEFAULT -1,
    "time_taken_fuzzysort" DOUBLE PRECISION DEFAULT -1,
    "time_taken_prisma" DOUBLE PRECISION DEFAULT -1,

    CONSTRAINT "SearchTelemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GetProductTelemetry" (
    "id" TEXT NOT NULL,
    "requested" TEXT NOT NULL,
    "found_results" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_taken" DOUBLE PRECISION NOT NULL DEFAULT -1,

    CONSTRAINT "GetProductTelemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GetCategoryProductsTelemetry" (
    "id" TEXT NOT NULL,
    "requested" TEXT NOT NULL,
    "time_taken" DOUBLE PRECISION NOT NULL DEFAULT -1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result_count" INTEGER NOT NULL,

    CONSTRAINT "GetCategoryProductsTelemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTelemetry" (
    "id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "time_taken" DOUBLE PRECISION NOT NULL DEFAULT -1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTelemetry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Products_fingerprint_key" ON "Products"("fingerprint");

-- CreateIndex
CREATE INDEX "Products_categoria_id_idx" ON "Products"("categoria_id");

-- CreateIndex
CREATE INDEX "Products_tienda_id_idx" ON "Products"("tienda_id");

-- CreateIndex
CREATE UNIQUE INDEX "Images_scraped_url_key" ON "Images"("scraped_url");

-- CreateIndex
CREATE INDEX "Images_producto_id_idx" ON "Images"("producto_id");

-- CreateIndex
CREATE INDEX "Prices_producto_id_created_at_idx" ON "Prices"("producto_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Dictionary_input_key" ON "Dictionary"("input");

-- AddForeignKey
ALTER TABLE "Sources" ADD CONSTRAINT "Sources_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sources" ADD CONSTRAINT "Sources_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobQueue" ADD CONSTRAINT "JobQueue_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "Sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "Categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_tienda_id_fkey" FOREIGN KEY ("tienda_id") REFERENCES "Shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Images" ADD CONSTRAINT "Images_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prices" ADD CONSTRAINT "Prices_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
