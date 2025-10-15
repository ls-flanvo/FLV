/*
  Warnings:

  - The values [ASSIGNED,ACCEPTED,EN_ROUTE,ARRIVED] on the enum `RideStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `basePrice` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `bookingCode` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `cancelled` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledAt` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledBy` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `dropoffAddress` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `flightDate` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `flightStatus` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `paymentIntentId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `pickupAddress` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `pickupAirport` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `platformFee` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `refundAmount` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `refundEligible` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `refundStatus` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `bookings` table. All the data in the column will be lost.
  - The `flightTime` column on the `bookings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `address` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `approved` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `availability` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `completedRides` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `cqcExpiry` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `cqcNumber` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceCompany` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceExpiry` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceNumber` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `licenseExpiry` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `licensePlate` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `province` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `seats` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `surname` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `taxCode` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleBrand` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `acceptedAt` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `arrivedAt` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `assignedAt` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `driverEarnings` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `driverLat` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `driverLng` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `enRouteAt` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `lastLocationUpdate` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `platformFee` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `review` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verified` on the `users` table. All the data in the column will be lost.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_settings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[licenseNumber]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vehiclePlate]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rideGroupId]` on the table `rides` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `direction` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dropoffLocation` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupLocation` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Made the column `pickupLat` on table `bookings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pickupLng` on table `bookings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dropoffLat` on table `bookings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dropoffLng` on table `bookings` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `vehiclePlate` to the `drivers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleType` to the `drivers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledTime` to the `rides` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDistance` to the `rides` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `rides` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleType` to the `rides` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PASSENGER', 'DRIVER', 'ADMIN');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('FORMING', 'READY', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoutePointType" AS ENUM ('AIRPORT', 'PICKUP', 'DROPOFF');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('TO_AIRPORT', 'FROM_AIRPORT');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('SEDAN', 'SUV', 'VAN', 'LUXURY');

-- AlterEnum
BEGIN;
CREATE TYPE "RideStatus_new" AS ENUM ('SCHEDULED', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'PICKUP_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."rides" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "rides" ALTER COLUMN "status" TYPE "RideStatus_new" USING ("status"::text::"RideStatus_new");
ALTER TYPE "RideStatus" RENAME TO "RideStatus_old";
ALTER TYPE "RideStatus_new" RENAME TO "RideStatus";
DROP TYPE "public"."RideStatus_old";
ALTER TABLE "rides" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rides" DROP CONSTRAINT "rides_driverId_fkey";

-- DropIndex
DROP INDEX "public"."bookings_bookingCode_key";

-- DropIndex
DROP INDEX "public"."bookings_flightDate_idx";

-- DropIndex
DROP INDEX "public"."drivers_licensePlate_key";

-- DropIndex
DROP INDEX "public"."drivers_taxCode_key";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "basePrice",
DROP COLUMN "bookingCode",
DROP COLUMN "cancelled",
DROP COLUMN "cancelledAt",
DROP COLUMN "cancelledBy",
DROP COLUMN "dropoffAddress",
DROP COLUMN "flightDate",
DROP COLUMN "flightStatus",
DROP COLUMN "notes",
DROP COLUMN "paymentIntentId",
DROP COLUMN "paymentStatus",
DROP COLUMN "pickupAddress",
DROP COLUMN "pickupAirport",
DROP COLUMN "platformFee",
DROP COLUMN "refundAmount",
DROP COLUMN "refundEligible",
DROP COLUMN "refundStatus",
DROP COLUMN "totalPrice",
ADD COLUMN     "direction" "Direction" NOT NULL,
ADD COLUMN     "distance" DOUBLE PRECISION,
ADD COLUMN     "dropoffLocation" TEXT NOT NULL,
ADD COLUMN     "estimatedPrice" DOUBLE PRECISION,
ADD COLUMN     "finalPrice" DOUBLE PRECISION,
ADD COLUMN     "isGroupRide" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pickupLocation" TEXT NOT NULL,
ADD COLUMN     "specialRequests" TEXT,
DROP COLUMN "flightTime",
ADD COLUMN     "flightTime" TIMESTAMP(3),
ALTER COLUMN "pickupLat" SET NOT NULL,
ALTER COLUMN "pickupLng" SET NOT NULL,
ALTER COLUMN "dropoffLat" SET NOT NULL,
ALTER COLUMN "dropoffLng" SET NOT NULL,
ALTER COLUMN "luggage" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "drivers" DROP COLUMN "address",
DROP COLUMN "approved",
DROP COLUMN "approvedAt",
DROP COLUMN "availability",
DROP COLUMN "city",
DROP COLUMN "completedRides",
DROP COLUMN "cqcExpiry",
DROP COLUMN "cqcNumber",
DROP COLUMN "dateOfBirth",
DROP COLUMN "insuranceCompany",
DROP COLUMN "insuranceExpiry",
DROP COLUMN "insuranceNumber",
DROP COLUMN "licenseExpiry",
DROP COLUMN "licensePlate",
DROP COLUMN "province",
DROP COLUMN "rejectionReason",
DROP COLUMN "seats",
DROP COLUMN "status",
DROP COLUMN "surname",
DROP COLUMN "taxCode",
DROP COLUMN "vehicleBrand",
DROP COLUMN "zipCode",
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vehiclePlate" TEXT NOT NULL,
ADD COLUMN     "vehicleType" "VehicleType" NOT NULL,
ALTER COLUMN "rating" SET DEFAULT 5.0;

-- AlterTable
ALTER TABLE "rides" DROP COLUMN "acceptedAt",
DROP COLUMN "arrivedAt",
DROP COLUMN "assignedAt",
DROP COLUMN "completedAt",
DROP COLUMN "driverEarnings",
DROP COLUMN "driverLat",
DROP COLUMN "driverLng",
DROP COLUMN "enRouteAt",
DROP COLUMN "lastLocationUpdate",
DROP COLUMN "platformFee",
DROP COLUMN "rating",
DROP COLUMN "review",
DROP COLUMN "startedAt",
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "rideGroupId" TEXT,
ADD COLUMN     "scheduledTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3),
ADD COLUMN     "totalDistance" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "vehicleType" "VehicleType" NOT NULL,
ALTER COLUMN "bookingId" DROP NOT NULL,
ALTER COLUMN "driverId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "password",
DROP COLUMN "verified",
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "phone" SET NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'PASSENGER';

-- DropTable
DROP TABLE "public"."audit_logs";

-- DropTable
DROP TABLE "public"."notifications";

-- DropTable
DROP TABLE "public"."system_settings";

-- DropEnum
DROP TYPE "public"."DriverStatus";

-- DropEnum
DROP TYPE "public"."FlightStatus";

-- DropEnum
DROP TYPE "public"."PaymentStatus";

-- DropEnum
DROP TYPE "public"."Role";

-- CreateTable
CREATE TABLE "ride_groups" (
    "id" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "status" "GroupStatus" NOT NULL DEFAULT 'FORMING',
    "maxCapacity" INTEGER NOT NULL DEFAULT 7,
    "currentCapacity" INTEGER NOT NULL DEFAULT 0,
    "currentLuggage" INTEGER NOT NULL DEFAULT 0,
    "targetPickupTime" TIMESTAMP(3) NOT NULL,
    "actualStartTime" TIMESTAMP(3),
    "actualEndTime" TIMESTAMP(3),
    "basePrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION,
    "totalDistance" DOUBLE PRECISION,
    "estimatedDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ride_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "rideGroupId" TEXT NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'PENDING',
    "memberOrder" INTEGER NOT NULL,
    "estimatedPickupTime" TIMESTAMP(3),
    "actualPickupTime" TIMESTAMP(3),
    "estimatedDropoffTime" TIMESTAMP(3),
    "actualDropoffTime" TIMESTAMP(3),
    "distanceInRoute" DOUBLE PRECISION,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_routes" (
    "id" TEXT NOT NULL,
    "rideGroupId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" "RoutePointType" NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "estimatedTime" TIMESTAMP(3) NOT NULL,
    "actualTime" TIMESTAMP(3),
    "bookingId" TEXT,
    "distanceFromPrevious" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_breakdowns" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "rideGroupId" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "distanceFee" DOUBLE PRECISION NOT NULL,
    "timeFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "airportFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "surcharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sharePercentage" DOUBLE PRECISION,
    "savings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airports" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timezone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ride_groups_status_idx" ON "ride_groups"("status");

-- CreateIndex
CREATE INDEX "ride_groups_direction_idx" ON "ride_groups"("direction");

-- CreateIndex
CREATE INDEX "ride_groups_targetPickupTime_idx" ON "ride_groups"("targetPickupTime");

-- CreateIndex
CREATE INDEX "group_members_rideGroupId_idx" ON "group_members"("rideGroupId");

-- CreateIndex
CREATE INDEX "group_members_status_idx" ON "group_members"("status");

-- CreateIndex
CREATE INDEX "group_members_memberOrder_idx" ON "group_members"("memberOrder");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_bookingId_rideGroupId_key" ON "group_members"("bookingId", "rideGroupId");

-- CreateIndex
CREATE INDEX "group_routes_rideGroupId_idx" ON "group_routes"("rideGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "group_routes_rideGroupId_sequence_key" ON "group_routes"("rideGroupId", "sequence");

-- CreateIndex
CREATE INDEX "price_breakdowns_bookingId_idx" ON "price_breakdowns"("bookingId");

-- CreateIndex
CREATE INDEX "price_breakdowns_rideGroupId_idx" ON "price_breakdowns"("rideGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "airports_code_key" ON "airports"("code");

-- CreateIndex
CREATE INDEX "airports_code_idx" ON "airports"("code");

-- CreateIndex
CREATE INDEX "airports_city_idx" ON "airports"("city");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE INDEX "bookings_flightNumber_idx" ON "bookings"("flightNumber");

-- CreateIndex
CREATE INDEX "bookings_pickupTime_idx" ON "bookings"("pickupTime");

-- CreateIndex
CREATE INDEX "bookings_isGroupRide_idx" ON "bookings"("isGroupRide");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_licenseNumber_key" ON "drivers"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_vehiclePlate_key" ON "drivers"("vehiclePlate");

-- CreateIndex
CREATE INDEX "drivers_isAvailable_vehicleType_idx" ON "drivers"("isAvailable", "vehicleType");

-- CreateIndex
CREATE INDEX "drivers_licenseNumber_idx" ON "drivers"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "rides_rideGroupId_key" ON "rides"("rideGroupId");

-- CreateIndex
CREATE INDEX "rides_scheduledTime_idx" ON "rides"("scheduledTime");

-- CreateIndex
CREATE INDEX "rides_bookingId_idx" ON "rides"("bookingId");

-- CreateIndex
CREATE INDEX "rides_rideGroupId_idx" ON "rides"("rideGroupId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_rideGroupId_fkey" FOREIGN KEY ("rideGroupId") REFERENCES "ride_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_rideGroupId_fkey" FOREIGN KEY ("rideGroupId") REFERENCES "ride_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_routes" ADD CONSTRAINT "group_routes_rideGroupId_fkey" FOREIGN KEY ("rideGroupId") REFERENCES "ride_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_breakdowns" ADD CONSTRAINT "price_breakdowns_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_breakdowns" ADD CONSTRAINT "price_breakdowns_rideGroupId_fkey" FOREIGN KEY ("rideGroupId") REFERENCES "ride_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
