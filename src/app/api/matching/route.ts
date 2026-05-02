import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { haversineDistance } from '@/lib/dbscan-clustering';
import { AIRPORT_COORDS } from '@/lib/airports';
import { getPricingRates } from '@/lib/get-pricing-rates';

import { checkAndCloseExpiredGroups } from '@/lib/group-ready';

export async function POST(request: NextRequest) {
  try {
    const payload = await requireAuth(request);

    // Lazy check: chiudi gruppi scaduti ad ogni ricerca
    checkAndCloseExpiredGroups().catch(() => {});
    const { flightCode, destination, arrivalAirport, passengers = 1 } = await request.json();

    if (!flightCode) {
      return NextResponse.json({ error: 'Codice volo mancante' }, { status: 400 });
    }

    // Risolvi coordinate aeroporto d'arrivo
    const airportInfo = arrivalAirport ? AIRPORT_COORDS[arrivalAirport.toUpperCase()] : null;
    const airportLat = airportInfo?.lat ?? AIRPORT_COORDS['CTA'].lat;
    const airportLng = airportInfo?.lng ?? AIRPORT_COORDS['CTA'].lng;

    // Rates dinamici dal DB
    const rates = await getPricingRates();

    // Cerca gruppi FORMING per questo volo con posti disponibili, escludi quelli dove l'utente è già dentro
    const groups = await prisma.rideGroup.findMany({
      where: {
        flightNumber: flightCode.toUpperCase(),
        status: 'FORMING',
        currentCapacity: { lt: 7 },
        members: { none: { booking: { userId: payload.userId } } },
      },
      include: {
        members: {
          include: {
            booking: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { qualityScore: 'desc' },
      take: 5,
    });

    const matches = groups
      .map((group) => {
        const memberBookings = group.members.map((m) => m.booking);
        if (memberBookings.length === 0) return null;

        // Centroide delle destinazioni del gruppo
        const avgDropoffLat =
          memberBookings.reduce((s, b) => s + b.dropoffLat, 0) / memberBookings.length;
        const avgDropoffLng =
          memberBookings.reduce((s, b) => s + b.dropoffLng, 0) / memberBookings.length;

        // Usa destinazione reale del passeggero se disponibile, altrimenti centroide del gruppo
        const pricingLat = destination?.lat ?? avgDropoffLat;
        const pricingLng = destination?.lng ?? avgDropoffLng;
        const estimatedKm = haversineDistance(
          airportLat, airportLng,
          pricingLat, pricingLng
        );

        // Se la destinazione dell'utente è troppo lontana dal centroide del gruppo, salta
        if (destination?.lat && destination?.lng) {
          const userToGroupKm = haversineDistance(
            destination.lat, destination.lng,
            avgDropoffLat, avgDropoffLng
          );
          if (userToGroupKm > 30) return null; // Oltre 30km di distanza → gruppo incompatibile
        }

        // Pricing corretto: driver share diviso tra tutti, flanvo fee per km del passeggero
        const totalPax = group.currentCapacity + passengers;
        const totalDriverCost = estimatedKm * rates.driverRatePerKm;
        const driverSharePerPax = totalDriverCost / totalPax;

        const flanvoRate =
          estimatedKm >= 100
            ? rates.flanvoTier3Rate
            : estimatedKm >= 51
            ? rates.flanvoTier2Rate
            : rates.flanvoTier1Rate;
        const flanvoFee = estimatedKm * flanvoRate;
        const pricePerPerson =
          Math.round((driverSharePerPax + flanvoFee + rates.protectionFee) * 100) / 100;

        const passengers = group.members.map((m) => ({
          id: m.booking.user.id,
          name: m.booking.user.name,
          role: 'user' as const,
        }));

        const destinations = group.members.map((m) => ({
          address: m.booking.dropoffLocation,
          lat: m.booking.dropoffLat,
          lng: m.booking.dropoffLng,
          city: m.booking.dropoffLocation.split(',')[0] || m.booking.dropoffLocation,
        }));

        const estimatedDuration = Math.round(estimatedKm * (60 / 50) + group.members.length * 5);

        return {
          id: group.id,
          flightId: flightCode,
          passengers,
          destinations,
          totalPrice: Math.round(pricePerPerson * totalPax * 100) / 100,
          pricePerPerson,
          estimatedDuration,
          maxDeviation: group.eps,
          vehicleType: 'Van 7 posti', // Flanvo usa solo van da 7 posti
          departureTime: group.targetPickupTime.toISOString(),
          seats: group.maxCapacity - group.currentCapacity,
          score: group.qualityScore ?? 75,
          totalPassengers: group.currentCapacity,
          estimatedKm: Math.round(estimatedKm),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ matches });
  } catch (error) {
    return authErrorResponse(error);
  }
}
