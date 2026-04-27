import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { haversineDistance } from '@/lib/dbscan-clustering';

export async function POST(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    const { flightCode, destination } = await request.json();

    if (!flightCode) {
      return NextResponse.json({ error: 'Codice volo mancante' }, { status: 400 });
    }

    // Cerca gruppi FORMING per questo volo
    const groups = await prisma.rideGroup.findMany({
      where: {
        flightNumber: flightCode.toUpperCase(),
        status: 'FORMING',
        currentCapacity: { lt: 7 },
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
      take: 3,
    });

    const matches = groups.map((group) => {
      // Calcola centroide delle destinazioni del gruppo
      const memberBookings = group.members.map((m) => m.booking);
      const avgDropoffLat = memberBookings.reduce((s, b) => s + b.dropoffLat, 0) / memberBookings.length;
      const avgDropoffLng = memberBookings.reduce((s, b) => s + b.dropoffLng, 0) / memberBookings.length;

      // Stima distanza dal centroide all'aeroporto (FCO default)
      const airportLat = 41.8003;
      const airportLng = 12.2389;
      const estimatedKm = haversineDistance(airportLat, airportLng, avgDropoffLat, avgDropoffLng);

      // Prezzo per passeggero stimato (EQUO: driver cost / pax, tiered flanvo)
      const totalPax = group.currentCapacity + 1; // +1 per il nuovo passeggero
      const driverCost = estimatedKm * 2.0;
      const driverSharePerPax = driverCost / totalPax;
      const flanvoRate = estimatedKm >= 100 ? 0.20 : estimatedKm >= 51 ? 0.25 : 0.30;
      const flanvoFee = estimatedKm * flanvoRate;
      const pricePerPerson = Math.round((driverSharePerPax + flanvoFee + 1) * 100) / 100; // +1 protection

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

      // Stima durata: 3 min per km a 50 km/h + 5 min per stop
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
        vehicleType: group.currentCapacity >= 5 ? 'Van 7 posti' : group.currentCapacity >= 3 ? 'SUV 5 posti' : 'Sedan',
        departureTime: group.targetPickupTime.toISOString(),
        seats: group.maxCapacity - group.currentCapacity,
        score: group.qualityScore ?? 75,
      };
    });

    return NextResponse.json({ matches });
  } catch (error) {
    return authErrorResponse(error);
  }
}
