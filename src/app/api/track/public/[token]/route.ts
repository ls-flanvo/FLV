import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'flanvo-public-track');

    let bookingId: string;
    try {
      const { payload } = await jwtVerify(params.token, secret);
      if (!payload.pub || typeof payload.bookingId !== 'string') {
        return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
      }
      bookingId = payload.bookingId;
    } catch {
      return NextResponse.json({ error: 'Link scaduto o non valido' }, { status: 401 });
    }

    const member = await prisma.groupMember.findFirst({
      where: { booking: { id: bookingId } },
      include: {
        booking: { select: { dropoffLocation: true, dropoffLat: true, dropoffLng: true } },
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
                    user: { select: { name: true, phone: true } },
                  },
                },
              },
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

    if (!ride || !['IN_PROGRESS', 'ACTIVE'].includes(ride.status)) {
      return NextResponse.json({
        tracking: {
          status: 'not_started',
          message: 'La corsa non è ancora iniziata',
          flightNumber: member.rideGroup.flightNumber,
          destination: {
            address: member.booking.dropoffLocation,
            lat: member.booking.dropoffLat,
            lng: member.booking.dropoffLng,
          },
        },
      });
    }

    const currentLocation =
      driver?.currentLat && driver?.currentLng
        ? { lat: driver.currentLat, lng: driver.currentLng }
        : null;

    return NextResponse.json({
      tracking: {
        status: 'in_progress',
        flightNumber: member.rideGroup.flightNumber,
        currentLocation,
        destination: {
          address: member.booking.dropoffLocation,
          lat: member.booking.dropoffLat,
          lng: member.booking.dropoffLng,
        },
        estimatedArrival: ride.endTime?.toISOString() ?? null,
        driver: driver
          ? {
              name: driver.user.name,
              phone: driver.user.phone ?? '',
              rating: driver.rating ?? 5.0,
            }
          : null,
        vehicle: driver
          ? {
              brand: driver.vehicleModel.split(' ')[0],
              model: driver.vehicleModel,
              plate: driver.vehiclePlate,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Public tracking error:', error);
    return NextResponse.json({ error: 'Errore nel tracking' }, { status: 500 });
  }
}
