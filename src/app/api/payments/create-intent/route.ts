import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getPricingRates } from '@/lib/get-pricing-rates';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const createIntentSchema = z.object({
  memberId: z.string().cuid()
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(`create-intent:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Troppi tentativi. Riprova tra un minuto.' }, { status: 429 });
    }
    const payload = await requireAuth(req);
    const body = await req.json();
    const { memberId } = createIntentSchema.parse(body);

    // Get GroupMember with pricing data
    const member = await prisma.groupMember.findUnique({
      where: { id: memberId },
      include: {
        booking: { include: { user: true } },
        rideGroup: { include: { members: true } },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'GroupMember not found' }, { status: 404 });
    }

    // Verifica che il member appartenga all'utente autenticato
    if (member.booking.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    console.log('✅ Member trovato:', {
      id: member.id,
      paymentIntentId: member.paymentIntentId,
      groupStatus: member.rideGroup.status
    });

    // Pre-auth ammessa da FORMING (prenotazione) a ASSIGNED (driver assegnato)
    const allowedStatuses = ['FORMING', 'READY', 'CONFIRMED', 'ASSIGNED'];
    if (!allowedStatuses.includes(member.rideGroup.status)) {
      return NextResponse.json(
        { error: `Pagamento non disponibile per gruppi in stato: ${member.rideGroup.status}` },
        { status: 400 }
      );
    }

    // Se payment intent già esiste, restituiscilo
    if (member.paymentIntentId) {
      const existingIntent = await stripe.paymentIntents.retrieve(member.paymentIntentId);
      return NextResponse.json({
        success: true,
        clientSecret: existingIntent.client_secret,
        intentId: existingIntent.id,
        amount: existingIntent.amount / 100,
        flightNumber: member.rideGroup.flightNumber,
        groupSize: member.rideGroup.members.filter(m => m.status !== 'CANCELLED').length,
        dropoffLocation: member.booking.dropoffLocation,
      });
    }

    // Carica tariffe dinamiche dal DB
    const rates = await getPricingRates();

    let driverShare = member.driverShare;
    let kmOnboard = member.kmOnboard;

    if (!driverShare || !kmOnboard) {
      // Calcola distanza haversine tra pickup (aeroporto) e dropoff (casa utente)
      const toRad = (d: number) => (d * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(member.booking.dropoffLat - member.booking.pickupLat);
      const dLng = toRad(member.booking.dropoffLng - member.booking.pickupLng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(member.booking.pickupLat)) *
          Math.cos(toRad(member.booking.dropoffLat)) *
          Math.sin(dLng / 2) ** 2;
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      kmOnboard = distance;
      // Driver share: costo totale route diviso tra i passeggeri del gruppo
      const groupSize = member.rideGroup.members.length || 1;
      driverShare = (distance * rates.driverRatePerKm) / groupSize;
    }

    const flanvoFeeRate =
      kmOnboard >= 100
        ? rates.flanvoTier3Rate
        : kmOnboard >= 51
        ? rates.flanvoTier2Rate
        : rates.flanvoTier1Rate;
    const flanvoFee = kmOnboard * flanvoFeeRate;
    const protectionFee = rates.protectionFee;
    const totalPrice = driverShare + flanvoFee + protectionFee;


    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Convert to cents
      currency: 'eur',
      capture_method: 'manual', // CRITICAL: manual capture
      metadata: {
        groupId: member.rideGroupId,
        memberId: member.id,
        bookingId: member.bookingId,
        kmOnboard: kmOnboard.toString(),
        driverShare: driverShare.toFixed(2),
        flanvoFee: flanvoFee.toFixed(2),
        flanvoFeeRate: flanvoFeeRate.toString(),
        protectionFee: protectionFee.toFixed(2),
        flightNumber: member.rideGroup.flightNumber,
        numPassengers: member.booking.passengers.toString()
      },
      description: `Flanvo Pool - Flight ${member.rideGroup.flightNumber}`
    });


    // Save intentId in GroupMember
    await prisma.groupMember.update({
      where: { id: memberId },
      data: {
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'PENDING',
        driverShare,
        flanvoFee,
        flanvoFeeRate,
        totalPrice,
        kmOnboard,
        kmDirect: member.kmDirect || kmOnboard // Se non c'è ancora, usa lo stesso valore
      }
    });

    // Create audit log
    await prisma.priceAuditLog.create({
      data: {
        rideGroupId: member.rideGroupId,
        bookingId: member.bookingId,
        routeVersion: member.rideGroup.routeVersion,
        totalRouteKm: member.rideGroup.totalRouteKm || kmOnboard,
        directKm: member.kmDirect || kmOnboard,
        detourKm: member.detourKm || 0,
        detourPercent: member.detourPercent || 0,
        baseFarePerKm: flanvoFeeRate,
        totalBaseFare: flanvoFee,
        driverRatePerKm: 2.00,
        totalDriverPay: driverShare,
        flanvoFeeRate: flanvoFeeRate,
        flanvoFee: flanvoFee,
        finalPrice: totalPrice,
        maxDetourPercent: member.booking.maxDetourPercent,
        maxDetourMinutes: member.booking.maxDetourMinutes,
        constraintsMet: true,
        calculatedBy: 'system',
        notes: `Payment Intent created: ${paymentIntent.id} (status: ${member.rideGroup.status})`
      }
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      intentId: paymentIntent.id,
      amount: totalPrice,
      flightNumber: member.rideGroup.flightNumber,
      groupSize: member.rideGroup.members.filter(m => m.status !== 'CANCELLED').length,
      dropoffLocation: member.booking.dropoffLocation,
      breakdown: { driverShare, flanvoFee, flanvoFeeRate, protectionFee, totalPrice, kmOnboard },
    });

  } catch (error: unknown) {
    if ((error as { name?: string })?.name === 'AuthError') return authErrorResponse(error);
    console.error('Create intent error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    const stripeErr = error as { type?: string; message?: string };
    if (stripeErr.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid payment request', details: stripeErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}