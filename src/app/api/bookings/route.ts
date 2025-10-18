import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
  userId: string;
  email: string;
}

// GET - Lista bookings
export async function GET(request: NextRequest) {
  try {
    // Verifica JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token mancante' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return NextResponse.json(
        { error: 'Token non valido' },
        { status: 401 }
      );
    }

    // Recupera bookings dell'utente
    const bookings = await prisma.booking.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        groupMember: true,
      }
    });

    return NextResponse.json({ bookings });

  } catch (error) {
    console.error('❌ Errore recupero bookings:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle prenotazioni' },
      { status: 500 }
    );
  }
}

// POST - Crea nuovo booking
export async function POST(request: NextRequest) {
  try {
    // 1. Verifica JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token mancante o non valido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return NextResponse.json(
        { error: 'Token non valido o scaduto' },
        { status: 401 }
      );
    }

    // 2. Verifica che l'utente esista
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    // 3. Estrai i dati del booking
    const body = await request.json();
    console.log('📦 Ricevuta richiesta booking:', body);

    // 4. Validazione campi obbligatori
    const required = [
      'pickupLocation', 'pickupLat', 'pickupLng',
      'dropoffLocation', 'dropoffLat', 'dropoffLng',
      'pickupTime', 'flightNumber', 'flightDate', 'direction'
    ];

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo obbligatorio mancante: ${field}` },
          { status: 400 }
        );
      }
    }

    // 5. Crea il booking nel database
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        pickupLocation: body.pickupLocation,
        pickupLat: body.pickupLat,
        pickupLng: body.pickupLng,
        dropoffLocation: body.dropoffLocation,
        dropoffLat: body.dropoffLat,
        dropoffLng: body.dropoffLng,
        pickupTime: new Date(body.pickupTime),
        flightNumber: body.flightNumber,
        flightDate: new Date(body.flightDate),
        flightTime: body.flightTime ? new Date(body.flightTime) : null,
        direction: body.direction,
        passengers: body.passengers || 1,
        luggage: body.luggage || 1,
        luggageCount: body.luggageCount || 2,
        passengerName: body.passengerName || user.name,
        specialRequests: body.specialRequests || null,
        estimatedPrice: body.estimatedPrice || body.sharePrice || null,
        finalPrice: body.finalPrice || body.sharePrice || null,
        distanceDirect: body.distanceDirect || null,
        status: 'PENDING',
        isGroupRide: body.isGroupRide || false,
        maxDetourMinutes: body.maxDetourMinutes || 10,
        maxDetourPercent: body.maxDetourPercent || 20,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    console.log('✅ Booking creato nel database:', booking.id);

    // 6. Crea RideGroup temporaneo per questo booking
    const rideGroup = await prisma.rideGroup.create({
      data: {
        flightNumber: booking.flightNumber,
        direction: booking.direction,
        targetPickupTime: booking.pickupTime,
        basePrice: booking.estimatedPrice || 0,
        status: 'FORMING',
        currentCapacity: booking.passengers,
        currentLuggage: booking.luggage,
      },
    });

    console.log('✅ RideGroup creato:', rideGroup.id);

    // 7. Crea GroupMember per questo booking
    const groupMember = await prisma.groupMember.create({
      data: {
        bookingId: booking.id,
        rideGroupId: rideGroup.id,
        status: 'PENDING',
        pickupOrder: 0,
        dropoffOrder: 0,
        paymentIntentId: body.paymentIntentId || null,
        paymentStatus: body.paymentIntentId ? 'AUTHORIZED' : 'PENDING',
      },
    });

    console.log('✅ GroupMember creato:', groupMember.id);

    // 8. Ritorna il booking
    return NextResponse.json({
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
        finalPrice: booking.finalPrice,
        status: booking.status,
        isGroupRide: booking.isGroupRide,
        createdAt: booking.createdAt,
      },
      rideGroup: {
        id: rideGroup.id,
        status: rideGroup.status,
      },
      groupMember: {
        id: groupMember.id,
        status: groupMember.status,
        paymentStatus: groupMember.paymentStatus,
      },
      message: 'Booking creato con successo'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Errore creazione booking:', error);
    return NextResponse.json(
      { 
        error: 'Errore nella creazione della prenotazione',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}