import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authErrorResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalDrivers,
      pendingDrivers,
      activeRides,
      todayRides,
      revenue,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
      prisma.driver.count({ where: { isVerified: true } }),
      prisma.driver.count({ where: { isVerified: false } }),
      prisma.rideGroup.count({ where: { status: { in: ['ASSIGNED', 'ACTIVE'] } } }),
      prisma.rideGroup.count({ where: { status: 'COMPLETED', updatedAt: { gte: today } } }),
      prisma.groupMember.aggregate({
        _sum: { flanvoFee: true },
        where: { paymentStatus: 'CAPTURED' },
      }),
    ]);

    // Ultime attività
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
      },
    });

    const recentDrivers = await prisma.driver.findMany({
      take: 5,
      where: { isVerified: false },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    const activity = [
      ...recentBookings.map((b) => ({
        id: b.id,
        type: 'booking',
        description: `${b.user.name} ha prenotato una corsa`,
        status: b.status.toLowerCase(),
        timestamp: b.createdAt.toISOString(),
      })),
      ...recentDrivers.map((d) => ({
        id: d.id,
        type: 'driver_pending',
        description: `${d.user.name} (${d.user.email}) ha richiesto di diventare autista`,
        status: 'pending',
        timestamp: d.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDrivers,
        pendingApprovals: pendingDrivers,
        activeRides,
        todayRides,
        totalRevenue: Math.round((revenue._sum.flanvoFee ?? 0) * 100) / 100,
      },
      activity,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
