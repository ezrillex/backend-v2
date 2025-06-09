-- AlterTable
ALTER TABLE "SearchTelemetry" ADD COLUMN     "time_taken_flexsearch" DOUBLE PRECISION DEFAULT -1,
ADD COLUMN     "time_taken_fuzzysort" DOUBLE PRECISION DEFAULT -1,
ADD COLUMN     "time_taken_prisma" DOUBLE PRECISION DEFAULT -1,
ALTER COLUMN "time_taken" DROP NOT NULL;
