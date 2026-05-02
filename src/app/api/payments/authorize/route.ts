import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { sendGroupConfirmed } from '@/lib/email';
import { createNotification } from '@/lib/notify';
import { notifyDriversGroupReady } from '@/lib/group-ready';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const schema = z.object({ paymentIntentId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    const { paymentIntentId } = schema.parse(await req.json());

    const member = await prisma.groupMember.findFirst({
      where: { paymentIntentId },
      include: {
        booking: { include: { user: true } },
        rideGroup: { include: { members: true } },
      },
    });

    if (!member) return NextResponse.json({ error: 'Payment intent non trovato' }, { status: 404 });

    // Verifica ownership
    if (member.booking.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Idempotente — già catturato
    if (member.paymentStatus === 'CAPTURED') {
      return NextResponse.json({ success: true, alreadyCaptured: true });
    }

    // Verifica che Stripe abbia davvero autorizzato
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'requires_capture') {
      return NextResponse.json(
        { error: `Pagamento non autorizzato. Stato Stripe: ${intent.status}` },
        { status: 400 }
      );
    }

    // Cattura immediata — Flanvo incassa subito, trasferisce al driver al drop-off
    const amountCents = Math.round((member.totalPrice ?? 0) * 100);
    if (amountCents > 0) {
      await stripe.paymentIntents.capture(paymentIntentId, { amount_to_capture: amountCents });
    }

    // Aggiorna DB → CAPTURED
    await prisma.groupMember.update({
      where: { id: member.id },
      data: { paymentStatus: 'CAPTURED', capturedAt: new Date() },
    });

    // Notifica in-app al passeggero
    const priceLabel = member.totalPrice ? `€${member.totalPrice.toFixed(2)}` : '';
    createNotification({
      userId: member.booking.userId,
      type: 'BOOKING_CONFIRMED',
      title: 'Pagamento confermato',
      body: `Pagamento ${priceLabel} confermato per il volo ${member.rideGroup.flightNumber}. Il driver è stato informato.`,
      data: { paymentIntentId, flightNumber: member.rideGroup.flightNumber },
    }).catch(() => {});

    // Email conferma al passeggero
    const activeMembers = member.rideGroup.members.filter(m => m.status !== 'CANCELLED');
    sendGroupConfirmed(member.booking.user.email, {
      flightNumber: member.rideGroup.flightNumber,
      pickupTime: member.booking.pickupTime.toISOString(),
      groupSize: activeMembers.length,
      finalPrice: member.totalPrice,
    }).catch(() => {});

    // Controlla se TUTTI i membri attivi hanno pagato
    const freshMembers = await prisma.groupMember.findMany({
      where: { rideGroupId: member.rideGroup.id, status: { not: 'CANCELLED' } },
      select: { paymentStatus: true },
    });
    const allPaid = freshMembers.every(m => m.paymentStatus === 'CAPTURED');

    return NextResponse.json({ success: true, captured: true, amount: member.totalPrice, allPaid });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Input non valido', details: error.errors }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}
