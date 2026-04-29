import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { sendCancellationConfirmed, sendCancellationPenalty } from '@/lib/email';
import { createNotification } from '@/lib/notify';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const CANCELLABLE = ['PENDING', 'CONFIRMED', 'IN_MATCHING', 'MATCHED'];

function getRefundPolicy(hoursToPickup: number): { refundPercent: number; label: string } {
  if (hoursToPickup > 24) return { refundPercent: 100, label: 'Rimborso completo (>24h)' };
  if (hoursToPickup > 12) return { refundPercent: 50, label: 'Rimborso 50% (12–24h)' };
  return { refundPercent: 0, label: 'Nessun rimborso (<12h)' };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await requireAuth(request);
    const booking = await prisma.booking.findFirst({
      where: { id: params.id, userId: payload.userId },
      include: { groupMember: { select: { paymentIntentId: true, paymentStatus: true } } },
    });
    if (!booking) return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });

    const cancellable = CANCELLABLE.includes(booking.status);
    const hoursToPickup = (new Date(booking.pickupTime).getTime() - Date.now()) / 3_600_000;
    const policy = getRefundPolicy(hoursToPickup);

    return NextResponse.json({
      bookingId: booking.id,
      status: booking.status,
      cancellable,
      hasPaymentIntent: !!booking.groupMember?.paymentIntentId,
      refundPercent: policy.refundPercent,
      cancellationPolicy: !cancellable
        ? 'Impossibile cancellare: corsa in corso o completata'
        : policy.label,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await requireAuth(request);

    const booking = await prisma.booking.findFirst({
      where: { id: params.id, userId: payload.userId },
      include: { groupMember: { include: { rideGroup: true } } },
    });

    if (!booking) return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    if (!CANCELLABLE.includes(booking.status)) {
      return NextResponse.json({ error: 'Impossibile cancellare: corsa in corso o già completata' }, { status: 409 });
    }

    const member = booking.groupMember;
    const hoursToPickup = (new Date(booking.pickupTime).getTime() - Date.now()) / 3_600_000;
    const { refundPercent, label } = getRefundPolicy(hoursToPickup);

    let refundedAmount = 0;

    if (member?.paymentIntentId && member.paymentStatus === 'AUTHORIZED') {
      const totalCents = Math.round((member.totalPrice ?? 0) * 100);

      if (refundPercent === 100) {
        // Rilascia tutta la pre-autorizzazione
        await stripe.paymentIntents.cancel(member.paymentIntentId).catch(console.error);
        refundedAmount = member.totalPrice ?? 0;
      } else if (refundPercent === 50) {
        // Cattura il 50% (penale), rilascia il resto
        const captureCents = Math.round(totalCents / 2);
        await stripe.paymentIntents
          .capture(member.paymentIntentId, { amount_to_capture: captureCents })
          .catch(console.error);
        refundedAmount = (member.totalPrice ?? 0) / 2;
      } else {
        // Cattura il 100% come penale
        await stripe.paymentIntents
          .capture(member.paymentIntentId, { amount_to_capture: totalCents })
          .catch(console.error);
        refundedAmount = 0;
      }

      await prisma.groupMember.update({
        where: { id: member.id },
        data: {
          paymentStatus: refundPercent === 100 ? 'REFUNDED' : 'CAPTURED',
          capturedAt: refundPercent < 100 ? new Date() : undefined,
        },
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
      if (member) {
        await tx.groupMember.update({ where: { id: member.id }, data: { status: 'CANCELLED' } });
        if (member.rideGroup) {
          const newCapacity = Math.max(0, member.rideGroup.currentCapacity - booking.passengers);
          await tx.rideGroup.update({
            where: { id: member.rideGroupId },
            data: {
              currentCapacity: newCapacity,
              currentLuggage: Math.max(0, member.rideGroup.currentLuggage - booking.luggage),
            },
          });
        }
      }
    });

    const userRecord = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, name: true },
    });

    if (userRecord) {
      const notifBody =
        refundPercent === 100
          ? `Prenotazione volo ${booking.flightNumber} cancellata. Rimborso completo di €${refundedAmount.toFixed(2)} in elaborazione.`
          : refundPercent === 50
          ? `Prenotazione volo ${booking.flightNumber} cancellata. Rimborso parziale €${refundedAmount.toFixed(2)} (policy ${label}).`
          : `Prenotazione volo ${booking.flightNumber} cancellata. Nessun rimborso previsto (cancellazione <12h dal volo).`;

      createNotification({
        userId: payload.userId,
        type: 'BOOKING_CANCELLED',
        title: 'Prenotazione cancellata',
        body: notifBody,
        data: { bookingId: booking.id, refundPercent, refundedAmount },
      }).catch(() => {});

      if (refundPercent === 0 && member?.totalPrice) {
        sendCancellationPenalty(userRecord.email, {
          userName: userRecord.name ?? 'Utente',
          flightNumber: booking.flightNumber,
          amount: member.totalPrice,
          receiptId: `FLV-PEN-${Date.now()}`,
        }).catch(() => {});
      } else {
        sendCancellationConfirmed(userRecord.email, {
          flightNumber: booking.flightNumber,
          refunded: refundPercent > 0,
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      refundPercent,
      refundedAmount,
      message: label,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
