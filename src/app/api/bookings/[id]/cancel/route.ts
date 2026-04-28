import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { sendCancellationConfirmed, sendCancellationPenalty } from '@/lib/email';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Pre-match: rimborso completo (pre-auth rilasciata)
const PRE_MATCH_STATUSES = ['PENDING', 'CONFIRMED', 'IN_MATCHING'];
// Post-match: nessun rimborso (policy know-how doc §5.1)
const POST_MATCH_STATUSES = ['MATCHED'];
const ALL_CANCELLABLE = [...PRE_MATCH_STATUSES, ...POST_MATCH_STATUSES];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await requireAuth(request);

    const booking = await prisma.booking.findFirst({
      where: { id: params.id, userId: payload.userId },
      include: {
        groupMember: { select: { paymentIntentId: true, paymentStatus: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    const isPreMatch = PRE_MATCH_STATUSES.includes(booking.status);
    const isPostMatch = POST_MATCH_STATUSES.includes(booking.status);
    const cancellable = ALL_CANCELLABLE.includes(booking.status);

    return NextResponse.json({
      bookingId: booking.id,
      status: booking.status,
      refundEligible: isPreMatch,
      cancellable,
      hasPaymentIntent: !!booking.groupMember?.paymentIntentId,
      cancellationPolicy: !cancellable
        ? 'Impossibile cancellare: corsa in corso o completata'
        : isPreMatch
          ? 'Cancellazione gratuita: pre-autorizzazione verrà rilasciata'
          : 'Cancellazione post-match: nessun rimborso previsto (policy Flanvo)',
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await requireAuth(request);

    const booking = await prisma.booking.findFirst({
      where: { id: params.id, userId: payload.userId },
      include: {
        groupMember: { include: { rideGroup: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    if (!ALL_CANCELLABLE.includes(booking.status)) {
      return NextResponse.json(
        { error: 'Impossibile cancellare: corsa in corso o già completata' },
        { status: 409 }
      );
    }

    const member = booking.groupMember;
    const isPreMatch = PRE_MATCH_STATUSES.includes(booking.status);
    let refunded = false;

    if (member?.paymentIntentId && member.paymentStatus === 'AUTHORIZED') {
      if (isPreMatch) {
        // PRE-MATCH: rilascia la pre-autorizzazione (rimborso completo)
        try {
          await stripe.paymentIntents.cancel(member.paymentIntentId);
          refunded = true;
        } catch (stripeError) {
          console.error('Stripe cancel error:', stripeError);
        }
      } else {
        // POST-MATCH: cattura immediata dell'intero importo come penale (opzione A)
        // L'utente ha confermato post-match — nessun rimborso per policy Flanvo §5.1
        try {
          await stripe.paymentIntents.capture(member.paymentIntentId, {
            amount_to_capture: Math.round((member.totalPrice ?? 0) * 100),
          });
          // Aggiorna stato pagamento a CAPTURED (penale trattenuta da Flanvo)
          await prisma.groupMember.update({
            where: { id: member.id },
            data: { paymentStatus: 'CAPTURED', capturedAt: new Date() },
          });
        } catch (stripeError) {
          console.error('Stripe capture penalty error:', stripeError);
          // Se la cattura fallisce, rilascia comunque (non bloccare la cancellazione)
          try {
            await stripe.paymentIntents.cancel(member.paymentIntentId);
          } catch {}
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
      });

      if (member) {
        await tx.groupMember.update({
          where: { id: member.id },
          data: {
            status: 'CANCELLED',
            paymentStatus: refunded ? 'REFUNDED' : member.paymentStatus,
          },
        });

        if (member.rideGroup) {
          const newCapacity = Math.max(0, member.rideGroup.currentCapacity - booking.passengers);
          await tx.rideGroup.update({
            where: { id: member.rideGroupId },
            data: {
              currentCapacity: newCapacity,
              currentLuggage: Math.max(0, member.rideGroup.currentLuggage - booking.luggage),
              status: newCapacity < 2 ? 'NO_MATCH' : member.rideGroup.status,
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
      if (!isPreMatch && member?.totalPrice) {
        // Post-match: email addebito penale
        const receiptId = `FLV-PEN-${Date.now()}`;
        sendCancellationPenalty(userRecord.email, {
          userName: userRecord.name ?? 'Utente',
          flightNumber: booking.flightNumber,
          amount: member.totalPrice,
          receiptId,
        }).catch(() => {});
      } else {
        sendCancellationConfirmed(userRecord.email, {
          flightNumber: booking.flightNumber,
          refunded,
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: isPreMatch
        ? 'Prenotazione cancellata. Pre-autorizzazione rilasciata.'
        : 'Prenotazione cancellata. Nessun rimborso previsto (cancellazione post-match).',
      refunded,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
