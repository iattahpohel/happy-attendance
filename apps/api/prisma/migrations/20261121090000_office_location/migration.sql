-- CreateEnum
CREATE TYPE "LocationStatus" AS ENUM ('OK', 'OUT_OF_RANGE', 'NO_LOCATION');

-- AlterTable
ALTER TABLE "AttendanceRecord"
  ADD COLUMN "checkInLat" DOUBLE PRECISION,
  ADD COLUMN "checkInLng" DOUBLE PRECISION,
  ADD COLUMN "checkInAccuracy" DOUBLE PRECISION,
  ADD COLUMN "checkInDistance" INTEGER,
  ADD COLUMN "checkInLocStatus" "LocationStatus" NOT NULL DEFAULT 'NO_LOCATION',
  ADD COLUMN "checkOutLat" DOUBLE PRECISION,
  ADD COLUMN "checkOutLng" DOUBLE PRECISION,
  ADD COLUMN "checkOutAccuracy" DOUBLE PRECISION,
  ADD COLUMN "checkOutDistance" INTEGER,
  ADD COLUMN "checkOutLocStatus" "LocationStatus";

-- CreateTable
CREATE TABLE "OfficeSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Công ty',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "maxDistanceMeters" INTEGER NOT NULL DEFAULT 200,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeSetting_pkey" PRIMARY KEY ("id")
);
