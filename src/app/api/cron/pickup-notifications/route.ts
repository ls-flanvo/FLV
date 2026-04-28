import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Vercel Cron autentica con CRON_SECRET
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
    const windowStart = new Date(now.getTime() + 25 * 60 * 1000); // 25 min da ora
    const windowEnd = new Date(now.getTime() + 35 * 60 * 1000);   // 35 min da ora

    // Trova gruppi con pickup imminente (25-35 min)
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
                user: { select: { email: true, name: true } },
              },
            },
          },
        },
        ride: {
          include: {
            driver: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
    });

    let notified = 0;

    for (const group of groups) {
      const driverName = group.ride?.driver?.user?.name ?? 'Il tuo autista';
      const pickupTime = group.targetPickupTime.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      });

      for (const member of group.members) {
        try {
          const { sendPickupReminder } = await import('@/lib/email');
          await sendPickupReminder(member.booking.user.email, {
            userName: member.booking.user.name ?? 'Passeggero',
            flightNumber: group.flightNumber,
            pickupTime,
            driverName,
            dropoffAddress: member.booking.dropoffLocation,
          });
          notified++;
        } catch {
          // non bloccare per errori email singoli
        }
      }
    }

    console.log(`[Cron] Pickup notifications: ${notified} email inviate per ${groups.length} gruppi`);
    return NextResponse.json({ ok: true, notified, groups: groups.length });
  } catch (error) {
    console.error('[Cron] Pickup notification error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
