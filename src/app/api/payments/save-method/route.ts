import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const schema = z.object({ paymentMethodId: z.string() });

// GET — controlla se l'utente ha una carta salvata
export async function GET(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { defaultPaymentMethodId: true, savedCardLast4: true, savedCardBrand: true },
    });
    return NextResponse.json({
      hasSavedCard: !!user?.defaultPaymentMethodId,
      last4: user?.savedCardLast4 ?? null,
      brand: user?.savedCardBrand ?? null,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    const { paymentMethodId } = schema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: 'Customer Stripe non trovato' }, { status: 400 });
    }

    // Recupera i dettagli della carta da Stripe
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    const last4 = pm.card?.last4 ?? null;
    const brand = pm.card?.brand ?? null;

    // Imposta come metodo di default sul Customer Stripe
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Salva su DB
    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        defaultPaymentMethodId: paymentMethodId,
        savedCardLast4: last4,
        savedCardBrand: brand,
      },
    });

    return NextResponse.json({ success: true, last4, brand });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Input non valido' }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}

// DELETE — rimuove la carta salvata
export async function DELETE(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        defaultPaymentMethodId: null,
        savedCardLast4: null,
        savedCardBrand: null,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
