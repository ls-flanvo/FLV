import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notify';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 25 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 35 * 60 * 1000);

    const groups = await prisma.rideGroup.findMany({
      where: {
        targetPickupTime: { gte: windowStart, lte: windowEnd },
        status: { in: ['CONFIRMED', 'ASSIGNED'] },
      },
      include: {
        members: {
          where: { status: 'CONFIRMED' },
          include: {
            booking: {
              include: {
                user: { select: { id: true, email: true, name: true } },
              },
            },
          },
        },
        ride: {
          include: {
            driver: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });

    let notified = 0;

    for (const group of groups) {
      const driverName = group.ride?.driver?.user?.name ?? 'Il tuo autista';
      const pickupTime = group.targetPickupTime.toLocaleTimeString('it-IT', {
        hour: '2-digit', minute: '2-digit',
      });

      for (const member of group.members) {
        try {
          // Notifica in-app
          await createNotification({
            userId: member.booking.user.id,
            type: 'DRIVER_ARRIVING',
            title: 'Pickup tra 30 minuti',
            body: `${driverName} arriva alle ${pickupTime}. Dirigiti verso il punto di incontro.`,
            data: { bookingId: member.bookingId, flightNumber: group.flightNumber },
          });

          // Email di reminder
          const { sendPickupReminder } = await import('@/lib/email');
          await sendPickupReminder(member.booking.user.email, {
            userName: member.booking.user.name ?? 'Passeggero',
            flightNumber: group.flightNumber,
            pickupTime,
            driverName,
            dropoffAddress: member.booking.dropoffLocation,
          });

          notified++;
        } catch { /* non bloccare per errori singoli */ }
      }
    }

    return NextResponse.json({ ok: true, notified, groups: groups.length });
  } catch (error) {
    console.error('[Cron] Pickup notification error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
