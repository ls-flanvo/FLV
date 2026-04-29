import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { getPricingRates } from '@/lib/get-pricing-rates';
import { haversineDistance } from '@/lib/dbscan-clustering';
import { sendGroupReady } from '@/lib/email';

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
              select: { id: true, status: true, qualityScore: true, totalPrice: true, currentCapacity: true, maxCapacity: true },
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
    if (!user) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });

    const body = await request.json();
    const required = ['pickupLocation', 'pickupLat', 'pickupLng', 'dropoffLocation', 'dropoffLat', 'dropoffLng', 'pickupTime', 'flightNumber', 'flightDate', 'direction'];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json({ error: `Campo obbligatorio mancante: ${field}` }, { status: 400 });
      }
    }

    // Crea booking PENDING (nessun pagamento ancora)
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

    // Unisciti a gruppo esistente oppure creane uno nuovo
    let rideGroup;
    let memberOrder: number;

    if (body.rideGroupId) {
      rideGroup = await prisma.rideGroup.findUnique({ where: { id: body.rideGroupId }, include: { members: true } });
      if (!rideGroup || rideGroup.status !== 'FORMING') {
        rideGroup = await prisma.rideGroup.create({
          data: { flightNumber: booking.flightNumber, direction: booking.direction, targetPickupTime: booking.pickupTime, basePrice: 0, status: 'FORMING', currentCapacity: booking.passengers, currentLuggage: booking.luggage },
          include: { members: true },
        });
        memberOrder = 1;
      } else {
        memberOrder = rideGroup.members.length + 1;
        await prisma.rideGroup.update({
          where: { id: rideGroup.id },
          data: { currentCapacity: { increment: booking.passengers }, currentLuggage: { increment: booking.luggage } },
        });
      }
    } else {
      rideGroup = await prisma.rideGroup.create({
        data: { flightNumber: booking.flightNumber, direction: booking.direction, targetPickupTime: booking.pickupTime, basePrice: 0, status: 'FORMING', currentCapacity: booking.passengers, currentLuggage: booking.luggage },
        include: { members: true },
      });
      memberOrder = 1;
    }

    const groupMember = await prisma.groupMember.create({
      data: { bookingId: booking.id, rideGroupId: rideGroup.id, status: 'PENDING', pickupOrder: memberOrder, dropoffOrder: memberOrder, paymentStatus: 'PENDING' },
    });

    // Aggiorna il gruppo con il nuovo membro
    const updatedGroup = await prisma.rideGroup.findUnique({
      where: { id: rideGroup.id },
      include: {
        members: {
          include: { booking: { include: { user: { select: { id: true, name: true, email: true } } } } },
        },
      },
    });

    // Controlla se il gruppo è pronto (minimo 2 passeggeri distinti)
    if (updatedGroup && updatedGroup.currentCapacity >= 2 && updatedGroup.status === 'FORMING') {
      // Calcola prezzo finale per ogni membro
      const rates = await getPricingRates();
      const memberBookings = updatedGroup.members.map(m => m.booking);
      const avgLat = memberBookings.reduce((s, b) => s + b.dropoffLat, 0) / memberBookings.length;
      const avgLng = memberBookings.reduce((s, b) => s + b.dropoffLng, 0) / memberBookings.length;
      const pickupLat = parseFloat(body.pickupLat);
      const pickupLng = parseFloat(body.pickupLng);
      const estimatedKm = haversineDistance(pickupLat, pickupLng, avgLat, avgLng);
      const totalPax = updatedGroup.currentCapacity;
      const driverShare = (estimatedKm * rates.driverRatePerKm) / totalPax;
      const flanvoRate = estimatedKm >= 100 ? rates.flanvoTier3Rate : estimatedKm >= 51 ? rates.flanvoTier2Rate : rates.flanvoTier1Rate;
      const pricePerPerson = Math.round((driverShare + estimatedKm * flanvoRate + rates.protectionFee) * 100) / 100;

      // Marca il gruppo come READY e tutti i membri come MATCHED
      await prisma.rideGroup.update({
        where: { id: updatedGroup.id },
        data: { status: 'READY', totalPrice: pricePerPerson * totalPax },
      });
      await prisma.groupMember.updateMany({
        where: { rideGroupId: updatedGroup.id },
        data: { status: 'PENDING' },
      });
      await prisma.booking.updateMany({
        where: { groupMember: { rideGroupId: updatedGroup.id } },
        data: { status: 'MATCHED', estimatedPrice: pricePerPerson },
      });

      // Notifica tutti i membri via email
      for (const member of updatedGroup.members) {
        const memberUser = member.booking.user;
        sendGroupReady(memberUser.email, {
          userName: memberUser.name,
          flightNumber: booking.flightNumber,
          groupSize: totalPax,
          pricePerPerson,
          groupMemberId: member.id,
          appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://flv-psi.vercel.app',
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      booking: { id: booking.id, status: booking.status, flightNumber: booking.flightNumber },
      rideGroup: { id: rideGroup.id, status: updatedGroup?.status ?? rideGroup.status },
      groupMember: { id: groupMember.id, status: groupMember.status },
      message: 'Richiesta registrata con successo',
    }, { status: 201 });
  } catch (error) {
    console.error('Errore creazione booking:', error);
    return NextResponse.json({ error: 'Errore nella creazione della prenotazione', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
