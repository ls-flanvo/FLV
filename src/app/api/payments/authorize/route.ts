import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { createNotification } from '@/lib/notify';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const schema = z.object({ memberId: z.string().cuid() });

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    const { memberId } = schema.parse(await req.json());

    const member = await prisma.groupMember.findUnique({
      where: { id: memberId },
      include: {
        booking: { include: { user: true } },
        rideGroup: { select: { id: true, flightNumber: true, status: true } },
      },
    });

    if (!member) return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    if (member.booking.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Idempotente
    if (member.paymentStatus === 'CAPTURED') {
      return NextResponse.json({ success: true, alreadyCaptured: true });
    }

    if (!member.paymentIntentId) {
      return NextResponse.json({ error: 'Nessun pagamento in corso' }, { status: 400 });
    }

    // Verifica che Stripe abbia completato il pagamento (capture_method: automatic → succeeded)
    const intent = await stripe.paymentIntents.retrieve(member.paymentIntentId);
    if (intent.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Pagamento non completato. Stato: ${intent.status}` },
        { status: 400 }
      );
    }

    // Aggiorna DB → CAPTURED + Booking → CONFIRMED
    await prisma.groupMember.update({
      where: { id: member.id },
      data: { paymentStatus: 'CAPTURED', capturedAt: new Date() },
    });
    await prisma.booking.update({
      where: { id: member.bookingId },
      data: { status: 'CONFIRMED' },
    });

    // Notifica passeggero
    const priceLabel = member.frozenPrice ? `€${member.frozenPrice.toFixed(2)}` : '';
    createNotification({
      userId: member.booking.userId,
      type: 'BOOKING_CONFIRMED',
      title: 'Posto confermato!',
      body: `Pagamento ${priceLabel} ricevuto per il volo ${member.rideGroup.flightNumber}. Ti avvisiamo quando il driver accetta.`,
      data: { memberId: member.id, flightNumber: member.rideGroup.flightNumber },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      captured: true,
      amount: member.frozenPrice ?? member.totalPrice,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Input non valido', details: error.errors }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}
