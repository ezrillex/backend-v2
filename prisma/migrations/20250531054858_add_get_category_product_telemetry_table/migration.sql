-- CreateTable
CREATE TABLE "GetCategoryProductsTelemetry" (
    "id" TEXT NOT NULL,
    "requested" TEXT NOT NULL,
    "found_results" BOOLEAN NOT NULL,
    "time_taken" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GetCategoryProductsTelemetry_pkey" PRIMARY KEY ("id")
);
