import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const createIntentSchema = z.object({ memberId: z.string().cuid() });

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`create-intent:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Troppi tentativi. Riprova tra un minuto.' }, { status: 429 });
    }

    const payload = await requireAuth(req);
    const body = await req.json();
    const { memberId } = createIntentSchema.parse(body);

    const member = await prisma.groupMember.findUnique({
      where: { id: memberId },
      include: {
        booking: { include: { user: true } },
        rideGroup: {
          select: {
            id: true, flightNumber: true, status: true,
            paymentWindowExpiresAt: true,
            members: { where: { status: { not: 'CANCELLED' } }, select: { id: true } },
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    if (member.booking.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Pagamento accettato solo durante la finestra aperta
    if (member.rideGroup.status !== 'PAYMENT_WINDOW') {
      const msg = member.rideGroup.status === 'CONFIRMED'
        ? 'Hai già pagato — il tuo posto è confermato.'
        : member.rideGroup.status === 'CANCELLED'
        ? 'Il gruppo è stato annullato.'
        : 'Pagamento non disponibile in questo momento.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Verifica che la finestra non sia scaduta
    const windowExpires = member.rideGroup.paymentWindowExpiresAt;
    if (!windowExpires || new Date() > windowExpires) {
      return NextResponse.json(
        { error: 'Il tempo per il pagamento è scaduto. Il tuo posto è stato liberato.' },
        { status: 410 }
      );
    }

    if (member.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Il tuo posto è stato cancellato.' }, { status: 400 });
    }

    // Se il PaymentIntent esiste già, restituiscilo con le info aggiornate
    if (member.paymentIntentId) {
      const existingIntent = await stripe.paymentIntents.retrieve(member.paymentIntentId);
      if (existingIntent.status !== 'canceled') {
        return NextResponse.json({
          success: true,
          clientSecret: existingIntent.client_secret,
          amount: existingIntent.amount / 100,
          paymentWindowExpiresAt: windowExpires.toISOString(),
          flightNumber: member.rideGroup.flightNumber,
          groupSize: member.rideGroup.members.length,
          dropoffLocation: member.booking.dropoffLocation,
          breakdown: {
            driverShare: member.driverShare ?? 0,
            flanvoFee: member.flanvoFee ?? 0,
            protectionFee: (member.frozenPrice ?? 0) - (member.driverShare ?? 0) - (member.flanvoFee ?? 0),
            kmOnboard: member.kmOnboard ?? 0,
          },
        });
      }
    }

    // Usa frozenPrice — impostato alla chiusura del gruppo, immutabile
    const amount = member.frozenPrice ?? member.totalPrice;
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Prezzo non disponibile' }, { status: 400 });
    }

    const breakdown = {
      driverShare: member.driverShare ?? 0,
      flanvoFee: member.flanvoFee ?? 0,
      protectionFee: amount - (member.driverShare ?? 0) - (member.flanvoFee ?? 0),
      kmOnboard: member.kmOnboard ?? 0,
    };

    // Controlla se l'utente ha una carta salvata per 1-tap payment
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { defaultPaymentMethodId: true, stripeCustomerId: true },
    });

    const piBase = {
      amount: Math.round(amount * 100),
      currency: 'eur' as const,
      customer: user?.stripeCustomerId ?? undefined,
      metadata: {
        groupId: member.rideGroupId,
        memberId: member.id,
        bookingId: member.bookingId,
        frozenPrice: amount.toFixed(2),
        flightNumber: member.rideGroup.flightNumber,
        numPassengers: member.booking.passengers.toString(),
      },
      description: `Flanvo — Volo ${member.rideGroup.flightNumber}`,
    };

    // Se carta salvata: crea e conferma automaticamente (1-tap)
    if (user?.defaultPaymentMethodId) {
      const intent = await stripe.paymentIntents.create({
        ...piBase,
        payment_method: user.defaultPaymentMethodId,
        confirm: true,
        capture_method: 'automatic',
      });

      await prisma.groupMember.update({
        where: { id: memberId },
        data: { paymentIntentId: intent.id, paymentStatus: intent.status === 'succeeded' ? 'CAPTURED' : 'PENDING' },
      });

      if (intent.status === 'succeeded') {
        // Già pagato — aggiorna booking e notifica
        await prisma.booking.update({ where: { id: member.bookingId }, data: { status: 'CONFIRMED' } });
        const { createNotification } = await import('@/lib/notify');
        createNotification({
          userId: payload.userId,
          type: 'BOOKING_CONFIRMED',
          title: 'Posto confermato!',
          body: `Pagamento €${amount.toFixed(2)} ricevuto per il volo ${member.rideGroup.flightNumber}.`,
          data: { memberId: member.id },
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        autoConfirmed: intent.status === 'succeeded',
        clientSecret: intent.status !== 'succeeded' ? intent.client_secret : null,
        amount,
        paymentWindowExpiresAt: windowExpires.toISOString(),
        flightNumber: member.rideGroup.flightNumber,
        groupSize: member.rideGroup.members.length,
        dropoffLocation: member.booking.dropoffLocation,
        breakdown,
      });
    }

    // Nessuna carta salvata — crea PI normale per inserimento manuale
    const paymentIntent = await stripe.paymentIntents.create({
      ...piBase,
      capture_method: 'automatic',
    });

    await prisma.groupMember.update({
      where: { id: memberId },
      data: { paymentIntentId: paymentIntent.id, paymentStatus: 'PENDING' },
    });

    return NextResponse.json({
      success: true,
      autoConfirmed: false,
      clientSecret: paymentIntent.client_secret,
      amount,
      paymentWindowExpiresAt: windowExpires.toISOString(),
      flightNumber: member.rideGroup.flightNumber,
      groupSize: member.rideGroup.members.length,
      dropoffLocation: member.booking.dropoffLocation,
      breakdown,
    });

  } catch (error: unknown) {
    if ((error as { name?: string })?.name === 'AuthError') return authErrorResponse(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.errors }, { status: 400 });
    }
    console.error('create-intent error:', error);
    return NextResponse.json({ error: 'Errore durante la preparazione del pagamento' }, { status: 500 });
  }
}
