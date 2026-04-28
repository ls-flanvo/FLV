import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authErrorResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const now = new Date();
    let since: Date;
    if (period === 'week') {
      since = new Date(now.getTime() - 7 * 86400000);
    } else if (period === 'quarter') {
      since = new Date(now.getTime() - 90 * 86400000);
    } else if (period === 'year') {
      since = new Date(now.getFullYear(), 0, 1);
    } else {
      since = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [groupsInPeriod, capturedMembers, topDriversRaw, completedGroups] =
      await Promise.all([
        prisma.rideGroup.findMany({
          where: { createdAt: { gte: since } },
          include: {
            members: { select: { totalPrice: true, flanvoFee: true } },
          },
        }),
        prisma.groupMember.findMany({
          where: { paymentStatus: 'CAPTURED', rideGroup: { createdAt: { gte: since } } },
          select: { totalPrice: true, flanvoFee: true },
        }),
        prisma.driver.findMany({
          where: { isVerified: true },
          select: {
            id: true,
            totalEarnings: true,
            rating: true,
            user: { select: { name: true } },
            rides: {
              where: { rideGroup: { status: 'COMPLETED' } },
              select: { id: true },
            },
          },
          orderBy: { totalEarnings: 'desc' },
          take: 5,
        }),
        prisma.rideGroup.findMany({
          where: { createdAt: { gte: since }, status: 'COMPLETED' },
          include: {
            members: { select: { totalPrice: true } },
          },
        }),
      ]);

    const totalRevenue = capturedMembers.reduce(
      (sum: number, m) => sum + (m.totalPrice ?? 0),
      0
    );
    const platformFee = capturedMembers.reduce(
      (sum: number, m) => sum + (m.flanvoFee ?? 0),
      0
    );

    const completedCount = groupsInPeriod.filter(
      (g) => g.status === 'COMPLETED'
    ).length;
    const matchedCount = groupsInPeriod.filter(
      (g) => !['FORMING', 'CANCELLED', 'NO_MATCH'].includes(g.status)
    ).length;
    const matchRate =
      groupsInPeriod.length > 0
        ? Math.round((matchedCount / groupsInPeriod.length) * 100)
        : 0;

    const avgGroupSize =
      completedCount > 0
        ? Math.round(
            (groupsInPeriod
              .filter((g) => g.status === 'COMPLETED')
              .reduce((sum: number, g) => sum + g.members.length, 0) /
              completedCount) * 10
          ) / 10
        : 0;

    const byDay: Record<string, { revenue: number; rides: number }> = {};
    for (const g of completedGroups) {
      const day = g.createdAt.toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { revenue: 0, rides: 0 };
      byDay[day].rides += 1;
      byDay[day].revenue += g.members.reduce(
        (s: number, m) => s + (m.totalPrice ?? 0),
        0
      );
    }

    const revenueByDay = Object.entries(byDay)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topDrivers = topDriversRaw.map((d) => ({
      name: d.user.name,
      earnings: d.totalEarnings ?? 0,
      rides: d.rides.length,
      rating: d.rating ?? 5.0,
    }));

    return NextResponse.json({
      totalRevenue,
      platformFee,
      driverEarnings: totalRevenue - platformFee,
      totalBookings: groupsInPeriod.reduce(
        (s: number, g) => s + g.members.length,
        0
      ),
      completedRides: completedCount,
      matchRate,
      avgGroupSize,
      averageBookingValue:
        capturedMembers.length > 0 ? totalRevenue / capturedMembers.length : 0,
      topDrivers,
      revenueByDay,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
