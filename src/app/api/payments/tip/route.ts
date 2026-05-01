import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const schema = z.object({
  bookingId: z.string(),
  amount: z.number().min(0.5).max(50),
});

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    const { bookingId, amount } = schema.parse(await req.json());

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId: payload.userId, status: 'COMPLETED' },
      include: {
        groupMember: {
          include: {
            rideGroup: {
              include: {
                ride: {
                  include: { driver: true },
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata o non completata' }, { status: 404 });
    }

    const driver = booking.groupMember?.rideGroup?.ride?.driver;
    if (!driver?.stripeConnectedAccountId) {
      return NextResponse.json({ error: 'Driver non trovato o account Stripe non collegato' }, { status: 400 });
    }

    const amountCents = Math.round(amount * 100);

    // Crea PaymentIntent per la mancia — cattura immediata
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      payment_method_types: ['card'],
      capture_method: 'automatic',
      metadata: { type: 'TIP', bookingId, driverId: driver.id },
      description: `Mancia Flanvo — corsa ${bookingId.slice(-6).toUpperCase()}`,
    });

    // Dopo il pagamento lato client, il transfer avviene tramite webhook
    // Per semplicità MVP: creiamo il transfer direttamente
    // (in produzione andrebbe fatto via webhook stripe payment_intent.succeeded)
    await stripe.transfers.create({
      amount: amountCents,
      currency: 'eur',
      destination: driver.stripeConnectedAccountId,
      metadata: { type: 'tip', bookingId, driverId: driver.id },
    });

    // Aggiorna stats driver
    await prisma.driver.update({
      where: { id: driver.id },
      data: { totalEarnings: { increment: amount } },
    });

    return NextResponse.json({
      success: true,
      clientSecret: intent.client_secret,
      amount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Importo non valido (min €0.50, max €50)' }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}
