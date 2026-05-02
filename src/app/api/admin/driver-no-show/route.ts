import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authErrorResponse } from '@/lib/api-auth';
import { createNotification } from '@/lib/notify';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

// POST /api/admin/driver-no-show
// Rimborso integrale a tutti i passeggeri quando il driver non si presenta
export async function POST(req: NextRequest) {
  try {
    const payload = await requireAdmin(req);
    const { rideGroupId, reason } = await req.json();

    if (!rideGroupId) {
      return NextResponse.json({ error: 'rideGroupId obbligatorio' }, { status: 400 });
    }

    const group = await prisma.rideGroup.findUnique({
      where: { id: rideGroupId },
      include: {
        members: {
          where: { status: { not: 'CANCELLED' } },
          include: { booking: { include: { user: true } } },
        },
      },
    });

    if (!group) return NextResponse.json({ error: 'Gruppo non trovato' }, { status: 404 });

    let totalRefunded = 0;
    const results: { memberId: string; refunded: number; error?: string }[] = [];

    for (const member of group.members) {
      if (!member.paymentIntentId || member.paymentStatus !== 'CAPTURED') {
        results.push({ memberId: member.id, refunded: 0, error: 'Nessun pagamento catturato' });
        continue;
      }

      try {
        const amountCents = Math.round((member.totalPrice ?? 0) * 100);
        if (amountCents > 0) {
          await stripe.refunds.create({
            payment_intent: member.paymentIntentId,
            amount: amountCents,
            metadata: { type: 'DRIVER_NO_SHOW', rideGroupId, adminId: payload.userId },
          });
        }

        await prisma.groupMember.update({
          where: { id: member.id },
          data: { paymentStatus: 'REFUNDED' },
        });

        await prisma.booking.updateMany({
          where: { groupMember: { id: member.id } },
          data: { status: 'CANCELLED' },
        });

        createNotification({
          userId: member.booking.userId,
          type: 'BOOKING_CONFIRMED',
          title: 'Rimborso integrale in arrivo',
          body: `Il driver per il volo ${group.flightNumber} non si è presentato. Rimborso di €${(member.totalPrice ?? 0).toFixed(2)} in elaborazione (2-5 giorni lavorativi).`,
          data: { rideGroupId },
        }).catch(() => {});

        totalRefunded += member.totalPrice ?? 0;
        results.push({ memberId: member.id, refunded: member.totalPrice ?? 0 });
      } catch (e) {
        results.push({ memberId: member.id, refunded: 0, error: String(e) });
      }
    }

    await prisma.rideGroup.update({
      where: { id: rideGroupId },
      data: { status: 'CANCELLED' },
    });

    await prisma.priceAuditLog.create({
      data: {
        rideGroupId,
        routeVersion: group.routeVersion,
        totalRouteKm: 0,
        directKm: 0,
        baseFarePerKm: 0,
        totalBaseFare: 0,
        driverRatePerKm: 0,
        totalDriverPay: 0,
        flanvoFeeRate: 0,
        flanvoFee: 0,
        finalPrice: 0,
        maxDetourPercent: 20,
        maxDetourMinutes: 10,
        constraintsMet: false,
        calculatedBy: payload.userId,
        notes: `DRIVER NO-SHOW: rimborso integrale €${totalRefunded.toFixed(2)} a ${results.length} passeggeri. Motivo: ${reason ?? 'non specificato'}`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, totalRefunded, results });
  } catch (error) {
    return authErrorResponse(error);
  }
}
