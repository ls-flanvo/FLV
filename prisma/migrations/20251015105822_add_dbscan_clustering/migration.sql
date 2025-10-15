/*
  Warnings:

  - You are about to drop the column `distance` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `distanceInRoute` on the `group_members` table. All the data in the column will be lost.
  - You are about to drop the column `memberOrder` on the `group_members` table. All the data in the column will be lost.
  - You are about to drop the column `actualTime` on the `group_routes` table. All the data in the column will be lost.
  - You are about to drop the column `distanceFromPrevious` on the `group_routes` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedTime` on the `group_routes` table. All the data in the column will be lost.
  - You are about to drop the column `actualEndTime` on the `ride_groups` table. All the data in the column will be lost.
  - You are about to drop the column `actualStartTime` on the `ride_groups` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedDuration` on the `ride_groups` table. All the data in the column will be lost.
  - You are about to drop the column `totalDistance` on the `ride_groups` table. All the data in the column will be lost.
  - You are about to drop the column `bookingId` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `rideGroupId` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the `price_breakdowns` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[bookingId]` on the table `group_members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[groupId]` on the table `rides` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dropoffOrder` to the `group_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupOrder` to the `group_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedArrival` to the `group_routes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `flightNumber` to the `ride_groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `rides` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDriverPay` to the `rides` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalRevenue` to the `rides` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QualityTier" AS ENUM ('EXCELLENT', 'GOOD', 'ACCEPTABLE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ClusterMethod" AS ENUM ('DBSCAN', 'MANUAL', 'NONE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'IN_MATCHING';
ALTER TYPE "BookingStatus" ADD VALUE 'MATCHED';
ALTER TYPE "BookingStatus" ADD VALUE 'NO_MATCH';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GroupStatus" ADD VALUE 'CONFIRMED';
ALTER TYPE "GroupStatus" ADD VALUE 'ASSIGNED';
ALTER TYPE "GroupStatus" ADD VALUE 'NO_MATCH';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MemberStatus" ADD VALUE 'NO_SHOW';
ALTER TYPE "MemberStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
ALTER TYPE "RideStatus" ADD VALUE 'SUPPLY_CHECKED';

-- DropForeignKey
ALTER TABLE "public"."price_breakdowns" DROP CONSTRAINT "price_breakdowns_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."price_breakdowns" DROP CONSTRAINT "price_breakdowns_rideGroupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rides" DROP CONSTRAINT "rides_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rides" DROP CONSTRAINT "rides_rideGroupId_fkey";

-- DropIndex
DROP INDEX "public"."group_members_bookingId_rideGroupId_key";

-- DropIndex
DROP INDEX "public"."group_members_memberOrder_idx";

-- DropIndex
DROP INDEX "public"."rides_bookingId_idx";

-- DropIndex
DROP INDEX "public"."rides_bookingId_key";

-- DropIndex
DROP INDEX "public"."rides_rideGroupId_idx";

-- DropIndex
DROP INDEX "public"."rides_rideGroupId_key";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "distance",
ADD COLUMN     "distanceDirect" DOUBLE PRECISION,
ADD COLUMN     "maxDetourMinutes" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "maxDetourPercent" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
ADD COLUMN     "microGroupId" TEXT;

-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "group_members" DROP COLUMN "distanceInRoute",
DROP COLUMN "memberOrder",
ADD COLUMN     "baseFare" DOUBLE PRECISION,
ADD COLUMN     "capturedAt" TIMESTAMP(3),
ADD COLUMN     "detourKm" DOUBLE PRECISION,
ADD COLUMN     "detourPercent" DOUBLE PRECISION,
ADD COLUMN     "driverShare" DOUBLE PRECISION,
ADD COLUMN     "dropoffOrder" INTEGER NOT NULL,
ADD COLUMN     "extraMinutes" INTEGER,
ADD COLUMN     "flanvoFee" DOUBLE PRECISION,
ADD COLUMN     "flanvoFeeRate" DOUBLE PRECISION,
ADD COLUMN     "kmDirect" DOUBLE PRECISION,
ADD COLUMN     "kmOnboard" DOUBLE PRECISION,
ADD COLUMN     "microGroupId" TEXT,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "pennyAdjustment" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "pickupOrder" INTEGER NOT NULL,
ADD COLUMN     "totalPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "group_routes" DROP COLUMN "actualTime",
DROP COLUMN "distanceFromPrevious",
DROP COLUMN "estimatedTime",
ADD COLUMN     "actualArrival" TIMESTAMP(3),
ADD COLUMN     "distanceFromPrev" DOUBLE PRECISION,
ADD COLUMN     "durationFromPrev" INTEGER,
ADD COLUMN     "estimatedArrival" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "reached" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reachedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ride_groups" DROP COLUMN "actualEndTime",
DROP COLUMN "actualStartTime",
DROP COLUMN "estimatedDuration",
DROP COLUMN "totalDistance",
ADD COLUMN     "bookingCloseTime" TIMESTAMP(3),
ADD COLUMN     "clusterMethod" "ClusterMethod" NOT NULL DEFAULT 'DBSCAN',
ADD COLUMN     "detourPercentage" DOUBLE PRECISION,
ADD COLUMN     "eps" DOUBLE PRECISION NOT NULL DEFAULT 8.5,
ADD COLUMN     "extraTimeMinutes" INTEGER,
ADD COLUMN     "flightNumber" TEXT NOT NULL,
ADD COLUMN     "matchConfirmTime" TIMESTAMP(3),
ADD COLUMN     "matrixCacheId" TEXT,
ADD COLUMN     "minSamples" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "passengerNotifyTime" TIMESTAMP(3),
ADD COLUMN     "qualityScore" DOUBLE PRECISION,
ADD COLUMN     "routeVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "stabilityTier" "QualityTier",
ADD COLUMN     "totalDuration" INTEGER,
ADD COLUMN     "totalRouteKm" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "rides" DROP COLUMN "bookingId",
DROP COLUMN "rideGroupId",
DROP COLUMN "totalPrice",
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "passengerNotified" TIMESTAMP(3),
ADD COLUMN     "pickupWindowEnd" TIMESTAMP(3),
ADD COLUMN     "pickupWindowStart" TIMESTAMP(3),
ADD COLUMN     "totalDriverPay" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalRevenue" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "public"."price_breakdowns";

-- CreateTable
CREATE TABLE "micro_groups" (
    "id" TEXT NOT NULL,
    "leadUserId" TEXT NOT NULL,
    "mustStayTogether" BOOLEAN NOT NULL DEFAULT true,
    "totalPassengers" INTEGER NOT NULL,
    "totalLuggage" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "micro_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_checks" (
    "id" TEXT NOT NULL,
    "rideGroupId" TEXT NOT NULL,
    "checkTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiredVehicles" INTEGER NOT NULL,
    "requiredCapacity" INTEGER NOT NULL,
    "availableVehicles" INTEGER NOT NULL,
    "availableDrivers" INTEGER NOT NULL,
    "backupDrivers" INTEGER NOT NULL DEFAULT 0,
    "checkPassed" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "driverAssigned" BOOLEAN NOT NULL DEFAULT false,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supply_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_audit_logs" (
    "id" TEXT NOT NULL,
    "rideGroupId" TEXT NOT NULL,
    "bookingId" TEXT,
    "routeVersion" INTEGER NOT NULL,
    "matrixCacheId" TEXT,
    "totalRouteKm" DOUBLE PRECISION NOT NULL,
    "directKm" DOUBLE PRECISION,
    "detourKm" DOUBLE PRECISION,
    "detourPercent" DOUBLE PRECISION,
    "baseFarePerKm" DOUBLE PRECISION NOT NULL,
    "totalBaseFare" DOUBLE PRECISION NOT NULL,
    "driverRatePerKm" DOUBLE PRECISION NOT NULL DEFAULT 2.00,
    "totalDriverPay" DOUBLE PRECISION NOT NULL,
    "flanvoFeeRate" DOUBLE PRECISION NOT NULL,
    "flanvoFee" DOUBLE PRECISION NOT NULL,
    "finalPrice" DOUBLE PRECISION NOT NULL,
    "matchScore" DOUBLE PRECISION,
    "qualityTier" "QualityTier",
    "maxDetourPercent" DOUBLE PRECISION NOT NULL,
    "maxDetourMinutes" INTEGER NOT NULL,
    "constraintsMet" BOOLEAN NOT NULL,
    "calculatedBy" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "price_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "micro_groups_leadUserId_idx" ON "micro_groups"("leadUserId");

-- CreateIndex
CREATE INDEX "micro_groups_isActive_idx" ON "micro_groups"("isActive");

-- CreateIndex
CREATE INDEX "supply_checks_rideGroupId_idx" ON "supply_checks"("rideGroupId");

-- CreateIndex
CREATE INDEX "supply_checks_checkTime_idx" ON "supply_checks"("checkTime");

-- CreateIndex
CREATE INDEX "supply_checks_checkPassed_idx" ON "supply_checks"("checkPassed");

-- CreateIndex
CREATE INDEX "price_audit_logs_rideGroupId_idx" ON "price_audit_logs"("rideGroupId");

-- CreateIndex
CREATE INDEX "price_audit_logs_bookingId_idx" ON "price_audit_logs"("bookingId");

-- CreateIndex
CREATE INDEX "price_audit_logs_calculatedAt_idx" ON "price_audit_logs"("calculatedAt");

-- CreateIndex
CREATE INDEX "bookings_microGroupId_idx" ON "bookings"("microGroupId");

-- CreateIndex
CREATE INDEX "bookings_direction_flightNumber_idx" ON "bookings"("direction", "flightNumber");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_bookingId_key" ON "group_members"("bookingId");

-- CreateIndex
CREATE INDEX "group_members_pickupOrder_idx" ON "group_members"("pickupOrder");

-- CreateIndex
CREATE INDEX "group_members_dropoffOrder_idx" ON "group_members"("dropoffOrder");

-- CreateIndex
CREATE INDEX "group_members_microGroupId_idx" ON "group_members"("microGroupId");

-- CreateIndex
CREATE INDEX "group_routes_type_idx" ON "group_routes"("type");

-- CreateIndex
CREATE INDEX "ride_groups_flightNumber_idx" ON "ride_groups"("flightNumber");

-- CreateIndex
CREATE INDEX "ride_groups_flightNumber_direction_idx" ON "ride_groups"("flightNumber", "direction");

-- CreateIndex
CREATE UNIQUE INDEX "rides_groupId_key" ON "rides"("groupId");

-- CreateIndex
CREATE INDEX "rides_groupId_idx" ON "rides"("groupId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_microGroupId_fkey" FOREIGN KEY ("microGroupId") REFERENCES "micro_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ride_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_microGroupId_fkey" FOREIGN KEY ("microGroupId") REFERENCES "micro_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "micro_groups" ADD CONSTRAINT "micro_groups_leadUserId_fkey" FOREIGN KEY ("leadUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_checks" ADD CONSTRAINT "supply_checks_rideGroupId_fkey" FOREIGN KEY ("rideGroupId") REFERENCES "ride_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_audit_logs" ADD CONSTRAINT "price_audit_logs_rideGroupId_fkey" FOREIGN KEY ("rideGroupId") REFERENCES "ride_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
