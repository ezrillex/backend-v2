-- CreateTable
CREATE TABLE "SearchTelemetry" (
    "id" TEXT NOT NULL,
    "search" TEXT NOT NULL,
    "result_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchTelemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GetProductTelemetry" (
    "id" TEXT NOT NULL,
    "requested" TEXT NOT NULL,
    "found_results" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GetProductTelemetry_pkey" PRIMARY KEY ("id")
);
