import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDriver, authErrorResponse } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const payload = await requireDriver(req);

    const driver = await prisma.driver.findUnique({
      where: { userId: payload.userId },
      select: { id: true, rating: true, totalRides: true },
    });
    if (!driver) return NextResponse.json({ error: 'Driver non trovato' }, { status: 404 });

    const members = await prisma.groupMember.findMany({
      where: {
        status: 'COMPLETED',
        paymentStatus: 'CAPTURED',
        rideGroup: { ride: { driverId: driver.id } },
      },
      orderBy: { capturedAt: 'desc' },
      include: {
        rideGroup: { select: { flightNumber: true, targetPickupTime: true } },
        booking: { select: { dropoffLocation: true } },
      },
    });

    // Raggruppa per flightNumber + data per mostrare totale per corsa
    const byGroup = new Map<string, {
      flightNumber: string;
      date: Date;
      dropoff: string;
      passengers: number;
      driverTotal: number;
      capturedAt: Date | null;
    }>();

    for (const m of members) {
      const key = `${m.rideGroup.flightNumber}_${m.rideGroup.targetPickupTime.toISOString()}`;
      if (!byGroup.has(key)) {
        byGroup.set(key, {
          flightNumber: m.rideGroup.flightNumber,
          date: m.rideGroup.targetPickupTime,
          dropoff: m.booking.dropoffLocation,
          passengers: 0,
          driverTotal: 0,
          capturedAt: m.capturedAt,
        });
      }
      const entry = byGroup.get(key)!;
      entry.passengers += 1;
      entry.driverTotal += m.driverShare ?? 0;
    }

    const rides = [...byGroup.values()]
      .sort((a, b) => (b.capturedAt?.getTime() ?? 0) - (a.capturedAt?.getTime() ?? 0))
      .map(r => ({ ...r, driverTotal: Math.round(r.driverTotal * 100) / 100 }));

    const totalEarnings = rides.reduce((sum, r) => sum + r.driverTotal, 0);
    const thisMonth = new Date();
    thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
    const monthEarnings = rides
      .filter(r => r.capturedAt && r.capturedAt >= thisMonth)
      .reduce((sum, r) => sum + r.driverTotal, 0);

    return NextResponse.json({
      stats: {
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        monthEarnings: Math.round(monthEarnings * 100) / 100,
        totalRides: rides.length,
        rating: driver.rating,
      },
      rides,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
