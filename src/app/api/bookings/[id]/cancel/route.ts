import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { sendCancellationConfirmed } from '@/lib/email';
import { createNotification } from '@/lib/notify';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'IN_MATCHING', 'MATCHED'];

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
    const groupStatus = booking.groupMember?.rideGroup?.status ?? '';
    const rideInProgress = ['ACTIVE', 'COMPLETED'].includes(groupStatus);
    const isPaid = ['AUTHORIZED', 'CAPTURED'].includes(booking.groupMember?.paymentStatus ?? '');

    return NextResponse.json({
      bookingId: booking.id,
      status: booking.status,
      cancellable: cancellable && !rideInProgress,
      isPaid,
      refundPercent: isPaid ? 0 : 100,
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
            rideGroup: {
              select: {
                id: true, status: true, currentCapacity: true, currentLuggage: true,
                flightNumber: true,
                ride: { select: { driver: { select: { userId: true } } } },
              },
            },
          },
        },
      },
    });

    if (!booking) return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    if (!CANCELLABLE_STATUSES.includes(booking.status)) {
      return NextResponse.json({ error: 'Impossibile cancellare: corsa in corso o già completata' }, { status: 409 });
    }

    const member = booking.groupMember;
    const groupStatus = member?.rideGroup?.status ?? '';

    if (['ACTIVE', 'COMPLETED'].includes(groupStatus)) {
      return NextResponse.json({ error: 'La corsa è già in corso — cancellazione non consentita.' }, { status: 409 });
    }

    const wasAuthorized = member?.paymentStatus === 'AUTHORIZED';
    const wasCaptured = member?.paymentStatus === 'CAPTURED';

    if (wasAuthorized && member?.paymentIntentId) {
      await stripe.paymentIntents.cancel(member.paymentIntentId).catch(console.error);
    }

    let shouldReopen = false;
    let shouldCancelGroup = false;

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });

      if (member) {
        await tx.groupMember.update({
          where: { id: member.id },
          data: {
            status: 'CANCELLED',
            ...(wasAuthorized ? { paymentStatus: 'REFUNDED' } : {}),
          },
        });

        if (member.rideGroup) {
          const newCapacity = Math.max(0, member.rideGroup.currentCapacity - booking.passengers);
          const newLuggage = Math.max(0, member.rideGroup.currentLuggage - (booking.luggage ?? 0));

          shouldReopen = member.rideGroup.status === 'CONFIRMED' && newCapacity >= 2;
          shouldCancelGroup = newCapacity === 0;

          await tx.rideGroup.update({
            where: { id: member.rideGroup.id },
            data: {
              currentCapacity: newCapacity,
              currentLuggage: newLuggage,
              ...(shouldCancelGroup ? { status: 'CANCELLED' }
                : shouldReopen ? { status: 'FORMING' }
                : {}),
            },
          });
        }
      }
    });

    // Notifica passeggero
    const userRecord = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, name: true },
    });

    if (userRecord) {
      createNotification({
        userId: payload.userId,
        type: 'BOOKING_CANCELLED',
        title: 'Prenotazione cancellata',
        body: wasCaptured
          ? `Prenotazione volo ${booking.flightNumber} cancellata. Il pagamento non è rimborsabile — apri una disputa entro 24h se hai una forza maggiore documentata.`
          : `Prenotazione volo ${booking.flightNumber} cancellata. Nessun addebito effettuato.`,
        data: { bookingId: booking.id },
      }).catch(() => {});

      sendCancellationConfirmed(userRecord.email, {
        flightNumber: booking.flightNumber,
        refundType: wasCaptured ? 'paid-no-refund' : false,
      }).catch(() => {});
    }

    const rideGroup = member?.rideGroup;

    // Punto 3: passeggero MATCHED cancella → notifica il driver (gruppo ASSIGNED)
    if (groupStatus === 'ASSIGNED' && rideGroup?.ride?.driver?.userId) {
      createNotification({
        userId: rideGroup.ride.driver.userId,
        type: 'BOOKING_CANCELLED',
        title: 'Passeggero uscito dalla corsa',
        body: `Un passeggero del volo ${booking.flightNumber} ha cancellato la prenotazione. Controlla i dettagli della corsa nella dashboard.`,
        data: { rideGroupId: rideGroup.id },
      }).catch(() => {});
    }

    // Punto 4: gruppo torna FORMING → notifica tutti i driver che la corsa non è più disponibile
    if (shouldReopen && rideGroup?.id) {
      const drivers = await prisma.driver.findMany({
        where: { isVerified: true, isAvailable: true },
        select: { userId: true },
      });
      for (const d of drivers) {
        createNotification({
          userId: d.userId,
          type: 'BOOKING_CANCELLED',
          title: 'Corsa non più disponibile',
          body: `La corsa per il volo ${booking.flightNumber} è tornata in formazione — un passeggero è uscito dal gruppo. Non è più accettabile.`,
          data: { rideGroupId: rideGroup.id },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: wasCaptured
        ? 'Prenotazione cancellata — il pagamento non è rimborsabile'
        : 'Prenotazione cancellata senza addebiti',
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
