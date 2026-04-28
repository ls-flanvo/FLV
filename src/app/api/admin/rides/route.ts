import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authErrorResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const search = searchParams.get('search') || '';

    const groups = await prisma.rideGroup.findMany({
      where: {
        ...(statusParam && statusParam !== 'all'
          ? { status: statusParam as never }
          : {}),
      },
      include: {
        members: {
          include: {
            booking: {
              include: {
                user: { select: { name: true, email: true, phone: true } },
              },
            },
          },
        },
        ride: {
          include: {
            driver: { include: { user: { select: { name: true, phone: true } } } },
          },
        },
      },
      orderBy: { targetPickupTime: 'asc' },
      take: 100,
    });

    const rides = groups
      .map((g) => {
        if (search) {
          const s = search.toLowerCase();
          const matchDriver = g.ride?.driver?.user?.name?.toLowerCase().includes(s);
          const matchFlight = g.flightNumber?.toLowerCase().includes(s);
          const matchPassenger = g.members.some((m) =>
            m.booking?.user?.name?.toLowerCase().includes(s)
          );
          if (!matchDriver && !matchFlight && !matchPassenger) return null;
        }

        const firstBooking = g.members[0]?.booking;

        return {
          id: g.id,
          flightNumber: g.flightNumber,
          status: g.status.toLowerCase(),
          scheduledTime: g.targetPickupTime,
          passengerCount: g.members.length,
          passengers: g.members.map((m) => ({
            name: m.booking?.user?.name ?? 'N/D',
            email: m.booking?.user?.email ?? '',
            phone: m.booking?.user?.phone ?? '',
          })),
          driver: g.ride?.driver
            ? {
                name: g.ride.driver.user.name,
                phone: g.ride.driver.user.phone ?? '',
                vehicle: g.ride.driver.vehicleModel,
                licensePlate: g.ride.driver.vehiclePlate,
              }
            : null,
          pickup: {
            address: firstBooking?.pickupLocation ?? 'Aeroporto',
            time: g.targetPickupTime.toISOString(),
          },
          dropoff: {
            address: firstBooking?.dropoffLocation ?? '',
          },
          totalRevenue: g.members.reduce(
            (sum: number, m) => sum + (m.totalPrice ?? 0),
            0
          ),
          createdAt: g.createdAt.toISOString(),
        };
      })
      .filter(Boolean);

    const stats = {
      total: groups.length,
      forming: groups.filter((g) => g.status === 'FORMING').length,
      confirmed: groups.filter((g) => g.status === 'CONFIRMED').length,
      inProgress: groups.filter((g) => g.status === 'ACTIVE').length,
      completed: groups.filter((g) => g.status === 'COMPLETED').length,
      cancelled: groups.filter((g) => g.status === 'CANCELLED').length,
    };

    return NextResponse.json({ rides, stats });
  } catch (error) {
    return authErrorResponse(error);
  }
}
