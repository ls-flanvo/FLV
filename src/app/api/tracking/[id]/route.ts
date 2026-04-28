import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // params.id può essere bookingId o groupMemberId
    const member = await prisma.groupMember.findFirst({
      where: {
        OR: [{ id: params.id }, { bookingId: params.id }],
      },
      include: {
        booking: {
          select: {
            dropoffLocation: true,
            dropoffLat: true,
            dropoffLng: true,
          },
        },
        rideGroup: {
          include: {
            ride: {
              include: {
                driver: {
                  select: {
                    vehicleModel: true,
                    vehiclePlate: true,
                    rating: true,
                    currentLat: true,
                    currentLng: true,
                    lastLocationAt: true,
                    user: { select: { name: true, phone: true } },
                  },
                },
              },
            },
            routes: {
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    const ride = member.rideGroup.ride;
    const driver = ride?.driver;

    if (!ride || ride.status === 'SCHEDULED' || ride.status === 'SUPPLY_CHECKED') {
      return NextResponse.json({
        tracking: {
          status: 'not_started',
          message: 'La corsa non è ancora iniziata',
          destination: {
            address: member.booking.dropoffLocation,
            lat: member.booking.dropoffLat,
            lng: member.booking.dropoffLng,
          },
        },
      });
    }

    const routes = member.rideGroup.routes;

    // Usa GPS live del driver se disponibile (aggiornato ogni 10s), altrimenti fallback a waypoint
    const currentLocation =
      driver?.currentLat && driver?.currentLng
        ? { lat: driver.currentLat, lng: driver.currentLng }
        : routes.length > 0
        ? { lat: routes[routes.length - 1].latitude, lng: routes[routes.length - 1].longitude }
        : { lat: member.booking.dropoffLat, lng: member.booking.dropoffLng };

    const remainingRoute = routes
      .filter((r) => !r.reached)
      .map((r) => ({ lat: r.latitude, lng: r.longitude }));

    const estimatedArrival = ride.endTime
      ? ride.endTime.toISOString()
      : new Date(Date.now() + 25 * 60 * 1000).toISOString();

    return NextResponse.json({
      tracking: {
        bookingId: params.id,
        status: ride.status.toLowerCase(),
        vehicle: {
          brand: driver?.vehicleModel?.split(' ')[0] ?? 'Veicolo',
          model: driver?.vehicleModel ?? 'In arrivo',
          plate: driver?.vehiclePlate ?? '---',
        },
        currentLocation,
        destination: {
          address: member.booking.dropoffLocation,
          lat: member.booking.dropoffLat,
          lng: member.booking.dropoffLng,
        },
        route: remainingRoute,
        estimatedArrival,
        driver: {
          name: driver?.user?.name ?? 'Autista assegnato',
          phone: driver?.user?.phone ?? '',
          rating: driver?.rating ?? 5.0,
        },
      },
    });
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json({ error: 'Errore nel tracking' }, { status: 500 });
  }
}
