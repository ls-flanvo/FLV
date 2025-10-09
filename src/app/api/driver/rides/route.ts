import { NextRequest, NextResponse } from 'next/server';
import { mockFlights, mockUsers, mockDestinations } from '@/lib/mockData';
import { DriverRide } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const driverRides: DriverRide[] = [
      {
        id: 'dr1',
        rideGroupId: 'rg1',
        flight: mockFlights[0],
        passengers: [mockUsers[0], mockUsers[1]],
        destinations: [mockDestinations[0], mockDestinations[1]],
        totalPrice: 45,
        status: 'pending',
        pickupTime: new Date(Date.now() + 7200000).toISOString(),
      },
      {
        id: 'dr2',
        rideGroupId: 'rg2',
        flight: mockFlights[1],
        passengers: [mockUsers[2]],
        destinations: [mockDestinations[2]],
        totalPrice: 30,
        status: 'pending',
        pickupTime: new Date(Date.now() + 10800000).toISOString(),
      },
    ];

    return NextResponse.json({ rides: driverRides });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nel recupero delle corse' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { rideId, status } = await request.json();
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json({
      success: true,
      message: `Corsa ${status === 'accepted' ? 'accettata' : 'rifiutata'}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento' },
      { status: 500 }
    );
  }
}