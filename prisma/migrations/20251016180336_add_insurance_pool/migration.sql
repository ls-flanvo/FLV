/*
  Warnings:

  - Added the required column `flightDate` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Made the column `flightNumber` on table `bookings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "destinationAddress" TEXT,
ADD COLUMN     "destinationLat" DOUBLE PRECISION,
ADD COLUMN     "destinationLng" DOUBLE PRECISION,
ADD COLUMN     "flightDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "luggageCount" INTEGER DEFAULT 2,
ADD COLUMN     "passengerName" TEXT,
ADD COLUMN     "poolGroupId" TEXT,
ADD COLUMN     "poolMetrics" JSONB,
ADD COLUMN     "poolPricing" JSONB,
ALTER COLUMN "flightNumber" SET NOT NULL;

-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "stripeAccountStatus" TEXT,
ADD COLUMN     "stripeConnectedAccountId" TEXT,
ADD COLUMN     "stripeDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "insurance_pool" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "collected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "driverCompensation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refundLosses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "operational" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_pool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurance_pool_month_key" ON "insurance_pool"("month");

-- CreateIndex
CREATE INDEX "bookings_flightNumber_flightDate_idx" ON "bookings"("flightNumber", "flightDate");

-- CreateIndex
CREATE INDEX "bookings_poolGroupId_idx" ON "bookings"("poolGroupId");

-- CreateIndex
CREATE INDEX "drivers_stripeConnectedAccountId_idx" ON "drivers"("stripeConnectedAccountId");
