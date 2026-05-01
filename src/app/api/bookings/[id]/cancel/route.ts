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

    // Aggiorna DB + gestisci gruppo residuo
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
      if (member) {
        await tx.groupMember.update({ where: { id: member.id }, data: { status: 'CANCELLED' } });
        if (member.rideGroup) {
          const newCapacity = Math.max(0, member.rideGroup.currentCapacity - booking.passengers);
          const newLuggage = Math.max(0, member.rideGroup.currentLuggage - (booking.luggage ?? 0));

          // Se nessuno ha ancora pagato e ci sono ancora pax → ricalcola prezzi per i rimanenti
          const remainingMembers = await tx.groupMember.findMany({
            where: { rideGroupId: member.rideGroup.id, status: { not: 'CANCELLED' }, id: { not: member.id } },
            include: { booking: { select: { dropoffLat: true, dropoffLng: true, pickupLat: true, pickupLng: true, passengers: true, id: true } } },
          });
          const anyPaid = remainingMembers.some(m => m.paymentStatus === 'AUTHORIZED');

          if (!anyPaid && remainingMembers.length > 0 && newCapacity >= 2) {
            // Ricalcola prezzi con il nuovo totalPax per chi non ha ancora pagato
            const { getPricingRates } = await import('@/lib/get-pricing-rates');
            const { haversineDistance } = await import('@/lib/dbscan-clustering');
            const rates = await getPricingRates();
            for (const m of remainingMembers) {
              const km = haversineDistance(m.booking.pickupLat, m.booking.pickupLng, m.booking.dropoffLat, m.booking.dropoffLng);
              const driverShare = (km * rates.driverRatePerKm) / newCapacity;
              const flanvoRate = km >= 100 ? rates.flanvoTier3Rate : km >= 51 ? rates.flanvoTier2Rate : rates.flanvoTier1Rate;
              const pricePerPerson = driverShare + km * flanvoRate + rates.protectionFee;
              const totalPrice = Math.round(pricePerPerson * m.booking.passengers * 100) / 100;
              await tx.booking.update({ where: { id: m.booking.id }, data: { estimatedPrice: totalPrice } });
            }
          }

          // Il gruppo torna FORMING se era CONFIRMED/READY e ci sono ancora pax
          const shouldReopen = ['CONFIRMED', 'READY'].includes(member.rideGroup.status) && newCapacity >= 2 && !anyPaid;

          await tx.rideGroup.update({
            where: { id: member.rideGroup.id },
            data: {
              currentCapacity: newCapacity,
              currentLuggage: newLuggage,
              ...(shouldReopen ? { status: 'FORMING' } : {}),
              ...(newCapacity === 0 ? { status: 'CANCELLED' } : {}),
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
