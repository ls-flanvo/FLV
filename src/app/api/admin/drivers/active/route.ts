import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authErrorResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const drivers = await prisma.driver.findMany({
      where: {
        isVerified: true,
        currentLat: { not: null },
        currentLng: { not: null },
        lastLocationAt: { gte: fiveMinutesAgo },
      },
      select: {
        id: true,
        currentLat: true,
        currentLng: true,
        lastLocationAt: true,
        vehicleModel: true,
        vehiclePlate: true,
        rating: true,
        user: { select: { name: true } },
        rides: {
          where: { rideGroup: { status: 'ACTIVE' } },
          select: {
            id: true,
            rideGroup: {
              select: {
                id: true,
                flightNumber: true,
                currentCapacity: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      drivers: drivers.map((d) => ({
        id: d.id,
        lat: d.currentLat!,
        lng: d.currentLng!,
        lastSeen: d.lastLocationAt,
        name: d.user.name,
        vehicle: d.vehicleModel,
        plate: d.vehiclePlate,
        rating: d.rating,
        activeRide: d.rides[0]?.rideGroup
          ? {
              rideId: d.rides[0].id,
              groupId: d.rides[0].rideGroup.id,
              flightNumber: d.rides[0].rideGroup.flightNumber,
              passengers: d.rides[0].rideGroup.currentCapacity,
            }
          : null,
      })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
