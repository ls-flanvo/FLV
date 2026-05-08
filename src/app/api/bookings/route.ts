import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { checkAndCloseExpiredGroups, closeGroupImmediately } from '@/lib/group-ready';
import { getPricingRates } from '@/lib/get-pricing-rates';
import { haversineDistance } from '@/lib/dbscan-clustering';
import { createNotification } from '@/lib/notify';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    const bookings = await prisma.booking.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        groupMember: {
          include: {
            rideGroup: {
              select: {
                id: true, status: true, qualityScore: true, totalPrice: true,
                currentCapacity: true, maxCapacity: true,
                flightStatus: true, meetingPoint: true, noShowAvailableAt: true,
                members: {
                  where: { status: { not: 'CANCELLED' } },
                  select: { id: true, booking: { select: { passengerName: true, passengers: true } } },
                },
              },
            },
          },
        },
      },
    });
    return NextResponse.json({ bookings });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`bookings:${getClientIp(request)}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Troppi tentativi. Riprova tra un minuto.' }, { status: 429 });
    }
    const payload = await requireAuth(request);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });

    const body = await request.json();
    const required = ['pickupLocation', 'pickupLat', 'pickupLng', 'dropoffLocation', 'dropoffLat', 'dropoffLng', 'pickupTime', 'flightNumber', 'flightDate', 'direction'];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json({ error: `Campo obbligatorio mancante: ${field}` }, { status: 400 });
      }
    }

    // Blocca prenotazioni duplicate per lo stesso volo
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        flightNumber: body.flightNumber.toUpperCase(),
        status: { in: ['PENDING', 'CONFIRMED', 'IN_MATCHING', 'MATCHED'] },
      },
    });
    if (existingBooking) {
      return NextResponse.json(
        { error: 'Hai già una prenotazione attiva per questo volo', bookingId: existingBooking.id },
        { status: 409 }
      );
    }

    // Lazy check: chiudi gruppi con finestra scaduta prima di creare il nuovo booking
    checkAndCloseExpiredGroups().catch(() => {});

    // Crea booking PENDING — nessun pagamento ancora
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        pickupLocation: body.pickupLocation,
        pickupLat: parseFloat(body.pickupLat),
        pickupLng: parseFloat(body.pickupLng),
        dropoffLocation: body.dropoffLocation,
        dropoffLat: parseFloat(body.dropoffLat),
        dropoffLng: parseFloat(body.dropoffLng),
        pickupTime: new Date(body.pickupTime),
        flightNumber: body.flightNumber.toUpperCase(),
        flightDate: new Date(body.flightDate),
        flightTime: body.flightTime ? new Date(body.flightTime) : null,
        direction: body.direction,
        passengers: body.passengers || 1,
        luggage: body.luggage || 1,
        luggageCount: body.luggageCount || 2,
        passengerName: body.passengerName || user.name,
        specialRequests: body.specialRequests || null,
        estimatedPrice: null, // Prezzo calcolato solo alla chiusura del gruppo
        status: 'PENDING',
        isGroupRide: true,
        maxDetourMinutes: body.maxDetourMinutes || 10,
        maxDetourPercent: body.maxDetourPercent || 20,
      },
    });

    // Unisciti a gruppo esistente o creane uno nuovo
    let rideGroup;
    let memberOrder: number;

    const airportCode = (body.arrivalAirport ?? 'CTA').toUpperCase();
    const flightDepartureTime = body.flightTime ? new Date(body.flightTime) : null;
    const newGroupData = {
      flightNumber: booking.flightNumber,
      arrivalAirport: airportCode,
      direction: booking.direction,
      targetPickupTime: booking.pickupTime,
      flightDepartureTime,
      basePrice: 0,
      status: 'FORMING' as const,
      currentCapacity: booking.passengers,
      currentLuggage: booking.luggage,
    };

    if (body.rideGroupId) {
      rideGroup = await prisma.rideGroup.findUnique({ where: { id: body.rideGroupId }, include: { members: true } });
      if (!rideGroup || rideGroup.status !== 'FORMING') {
        rideGroup = await prisma.rideGroup.create({ data: newGroupData, include: { members: true } });
        memberOrder = 1;
      } else {
        memberOrder = rideGroup.members.length + 1;
        rideGroup = await prisma.rideGroup.update({
          where: { id: rideGroup.id },
          data: { currentCapacity: { increment: booking.passengers }, currentLuggage: { increment: booking.luggage } },
          include: { members: true },
        });
      }
    } else {
      rideGroup = await prisma.rideGroup.create({ data: newGroupData, include: { members: true } });
      memberOrder = 1;
    }

    const groupMember = await prisma.groupMember.create({
      data: { bookingId: booking.id, rideGroupId: rideGroup.id, status: 'PENDING', pickupOrder: memberOrder, dropoffOrder: memberOrder, paymentStatus: 'PENDING' },
    });

    const updatedGroup = await prisma.rideGroup.findUnique({
      where: { id: rideGroup.id },
      select: { currentCapacity: true, maxCapacity: true },
    });

    // Van pieno (7 pax) → chiudi subito e attendi prima di rispondere
    // così il passeggero vede già "Gruppo completo · Attesa driver" in dashboard
    if (updatedGroup && updatedGroup.currentCapacity >= updatedGroup.maxCapacity) {
      await closeGroupImmediately(rideGroup.id);
    }

    // Calcola stima prezzo corrente (solo indicativa, mostrata in dashboard)
    let estimatedPriceNow: number | null = null;
    if (updatedGroup && updatedGroup.currentCapacity >= 1) {
      try {
        const rates = await getPricingRates();
        const estimatedKm = haversineDistance(
          parseFloat(body.pickupLat), parseFloat(body.pickupLng),
          parseFloat(body.dropoffLat), parseFloat(body.dropoffLng)
        );
        const totalPax = updatedGroup.currentCapacity;
        const driverShare = (estimatedKm * rates.driverRatePerKm) / totalPax;
        const flanvoRate = estimatedKm >= 100 ? rates.flanvoTier3Rate : estimatedKm >= 51 ? rates.flanvoTier2Rate : rates.flanvoTier1Rate;
        const pricePerPerson = driverShare + estimatedKm * flanvoRate + rates.protectionFee;
        estimatedPriceNow = Math.round(pricePerPerson * booking.passengers * 100) / 100;

        // Aggiorna stima nel booking
        await prisma.booking.update({
          where: { id: booking.id },
          data: { estimatedPrice: estimatedPriceNow },
        });
      } catch { /* non bloccante */ }
    }

    createNotification({
      userId: user.id,
      type: 'BOOKING_CONFIRMED',
      title: 'Richiesta registrata',
      body: `Stiamo cercando compagni di viaggio per il volo ${booking.flightNumber}. Ti avvisiamo appena il gruppo è pronto.`,
      data: { bookingId: booking.id, flightNumber: booking.flightNumber },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      booking: { id: booking.id, status: booking.status, flightNumber: booking.flightNumber, estimatedPrice: estimatedPriceNow },
      rideGroup: { id: rideGroup.id, status: 'FORMING', currentCapacity: updatedGroup?.currentCapacity },
      groupMember: { id: groupMember.id, status: groupMember.status },
      message: 'Richiesta registrata con successo',
    }, { status: 201 });
  } catch (error) {
    // Auth errors (401/403) vanno restituite con il codice corretto
    if ((error as { statusCode?: number })?.statusCode === 401 || (error as { statusCode?: number })?.statusCode === 403) {
      return authErrorResponse(error);
    }
    console.error('Errore creazione booking:', error);
    return NextResponse.json({ error: 'Errore nella creazione della prenotazione', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
