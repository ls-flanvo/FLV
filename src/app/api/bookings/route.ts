import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { sendBookingConfirmation } from '@/lib/email';

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
              select: { id: true, status: true, qualityScore: true, totalPrice: true },
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
    const payload = await requireAuth(request);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    const body = await request.json();

    const required = [
      'pickupLocation', 'pickupLat', 'pickupLng',
      'dropoffLocation', 'dropoffLat', 'dropoffLng',
      'pickupTime', 'flightNumber', 'flightDate', 'direction',
    ];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json({ error: `Campo obbligatorio mancante: ${field}` }, { status: 400 });
      }
    }

    // Crea il booking
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
        estimatedPrice: body.estimatedPrice || null,
        status: 'PENDING',
        isGroupRide: true,
        maxDetourMinutes: body.maxDetourMinutes || 10,
        maxDetourPercent: body.maxDetourPercent || 20,
      },
    });

    let rideGroup;
    let memberOrder: number;

    if (body.rideGroupId) {
      // Unisciti a un gruppo esistente
      rideGroup = await prisma.rideGroup.findUnique({
        where: { id: body.rideGroupId },
        include: { members: true },
      });

      if (!rideGroup || rideGroup.status !== 'FORMING') {
        // Gruppo non disponibile: crea nuovo
        rideGroup = await prisma.rideGroup.create({
          data: {
            flightNumber: booking.flightNumber,
            direction: booking.direction,
            targetPickupTime: booking.pickupTime,
            basePrice: 0,
            status: 'FORMING',
            currentCapacity: booking.passengers,
            currentLuggage: booking.luggage,
          },
          include: { members: true },
        });
        memberOrder = 1;
      } else {
        // Aggiorna capacità del gruppo esistente
        memberOrder = rideGroup.members.length + 1;
        await prisma.rideGroup.update({
          where: { id: rideGroup.id },
          data: {
            currentCapacity: { increment: booking.passengers },
            currentLuggage: { increment: booking.luggage },
          },
        });
      }
    } else {
      // Crea nuovo gruppo
      rideGroup = await prisma.rideGroup.create({
        data: {
          flightNumber: booking.flightNumber,
          direction: booking.direction,
          targetPickupTime: booking.pickupTime,
          basePrice: 0,
          status: 'FORMING',
          currentCapacity: booking.passengers,
          currentLuggage: booking.luggage,
        },
        include: { members: true },
      });
      memberOrder = 1;
    }

    const groupMember = await prisma.groupMember.create({
      data: {
        bookingId: booking.id,
        rideGroupId: rideGroup.id,
        status: 'PENDING',
        pickupOrder: memberOrder,
        dropoffOrder: memberOrder,
        paymentStatus: 'PENDING',
      },
    });

    // Email di conferma (non bloccante)
    sendBookingConfirmation(user.email, {
      flightNumber: booking.flightNumber,
      pickupTime: booking.pickupTime.toISOString(),
      estimatedPrice: booking.estimatedPrice,
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        booking: {
          id: booking.id,
          userId: booking.userId,
          pickupLocation: booking.pickupLocation,
          dropoffLocation: booking.dropoffLocation,
          pickupTime: booking.pickupTime,
          flightNumber: booking.flightNumber,
          direction: booking.direction,
          passengers: booking.passengers,
          luggage: booking.luggage,
          estimatedPrice: booking.estimatedPrice,
          status: booking.status,
          createdAt: booking.createdAt,
        },
        rideGroup: { id: rideGroup.id, status: rideGroup.status },
        groupMember: { id: groupMember.id, status: groupMember.status, paymentStatus: groupMember.paymentStatus },
        message: 'Booking creato con successo',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Errore creazione booking:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione della prenotazione', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
