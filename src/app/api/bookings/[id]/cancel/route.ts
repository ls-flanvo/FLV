import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { sendCancellationConfirmed } from '@/lib/email';
import { createNotification } from '@/lib/notify';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'IN_MATCHING', 'MATCHED'];
const DRIVER_LOCKED_GROUP_STATUSES = ['ASSIGNED', 'ACTIVE'];

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await requireAuth(request);
    const booking = await prisma.booking.findFirst({
      where: { id: params.id, userId: payload.userId },
      include: {
        groupMember: {
          select: {
            paymentIntentId: true,
            paymentStatus: true,
            rideGroup: { select: { status: true } },
          },
        },
      },
    });
    if (!booking) return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });

    const cancellable = CANCELLABLE_STATUSES.includes(booking.status);
    const driverAccepted = DRIVER_LOCKED_GROUP_STATUSES.includes(
      booking.groupMember?.rideGroup?.status ?? ''
    );
    const refundEligible = cancellable && !driverAccepted;

    return NextResponse.json({
      bookingId: booking.id,
      status: booking.status,
      cancellable: refundEligible,
      hasPaymentIntent: !!booking.groupMember?.paymentIntentId,
      refundPercent: refundEligible ? 100 : 0,
      cancellationPolicy: !cancellable
        ? 'Impossibile cancellare: corsa in corso o completata'
        : driverAccepted
        ? 'Nessun rimborso: il driver ha già accettato la corsa'
        : 'Rimborso completo — il driver non ha ancora accettato',
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
      include: {
        groupMember: {
          include: {
            rideGroup: { select: { id: true, status: true, currentCapacity: true, currentLuggage: true } },
          },
        },
      },
    });

    if (!booking) return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    if (!CANCELLABLE_STATUSES.includes(booking.status)) {
      return NextResponse.json({ error: 'Impossibile cancellare: corsa in corso o già completata' }, { status: 409 });
    }

    const member = booking.groupMember;
    const driverAccepted = DRIVER_LOCKED_GROUP_STATUSES.includes(member?.rideGroup?.status ?? '');

    if (driverAccepted) {
      return NextResponse.json(
        { error: 'Il driver ha già accettato la corsa. Cancellazione non consentita.' },
        { status: 409 }
      );
    }

    // Rimborso completo — rilascia la pre-autorizzazione Stripe se presente
    let refundedAmount = 0;
    if (member?.paymentIntentId && member.paymentStatus === 'AUTHORIZED') {
      await stripe.paymentIntents.cancel(member.paymentIntentId).catch(console.error);
      refundedAmount = member.totalPrice ?? 0;
      await prisma.groupMember.update({
        where: { id: member.id },
        data: { paymentStatus: 'REFUNDED' },
      });
    }

    // Aggiorna DB
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
      if (member) {
        await tx.groupMember.update({ where: { id: member.id }, data: { status: 'CANCELLED' } });
        if (member.rideGroup) {
          await tx.rideGroup.update({
            where: { id: member.rideGroup.id },
            data: {
              currentCapacity: Math.max(0, member.rideGroup.currentCapacity - booking.passengers),
              currentLuggage: Math.max(0, member.rideGroup.currentLuggage - (booking.luggage ?? 0)),
            },
          });
        }
      }
    });

    // Notifica
    const userRecord = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, name: true },
    });

    if (userRecord) {
      createNotification({
        userId: payload.userId,
        type: 'BOOKING_CANCELLED',
        title: 'Prenotazione cancellata',
        body: refundedAmount > 0
          ? `Prenotazione volo ${booking.flightNumber} cancellata. Rimborso completo di €${refundedAmount.toFixed(2)} in elaborazione.`
          : `Prenotazione volo ${booking.flightNumber} cancellata. Nessun addebito effettuato.`,
        data: { bookingId: booking.id, refundedAmount },
      }).catch(() => {});

      sendCancellationConfirmed(userRecord.email, {
        flightNumber: booking.flightNumber,
        refunded: refundedAmount > 0,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      refundPercent: 100,
      refundedAmount,
      message: refundedAmount > 0
        ? `Rimborso completo di €${refundedAmount.toFixed(2)} in elaborazione`
        : 'Prenotazione cancellata senza addebiti',
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
