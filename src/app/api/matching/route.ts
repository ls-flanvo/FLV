import { NextRequest, NextResponse } from 'next/server';
import { mockUsers, mockDestinations } from '@/lib/mockData';
import { RideMatch } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { flightId, destination } = await request.json();

    await new Promise(resolve => setTimeout(resolve, 1000));

    const matches: RideMatch[] = [
      {
        id: 'match-1',
        flightId,
        passengers: [mockUsers[1], mockUsers[2]],
        destinations: [destination, mockDestinations[1]],
        totalPrice: 60,
        pricePerPerson: 20,
        estimatedDuration: 35,
        maxDeviation: 8,
        vehicleType: 'Van 7 posti',
        departureTime: new Date(Date.now() + 2700000).toISOString(),
        seats: 7,
        score: 95,
      },
      {
        id: 'match-2',
        flightId,
        passengers: [mockUsers[1]],
        destinations: [destination, mockDestinations[0]],
        totalPrice: 50,
        pricePerPerson: 25,
        estimatedDuration: 30,
        maxDeviation: 5,
        vehicleType: 'Van 7 posti',
        departureTime: new Date(Date.now() + 3000000).toISOString(),
        seats: 7,
        score: 88,
      },
      {
        id: 'match-3',
        flightId,
        passengers: [mockUsers[2]],
        destinations: [destination, mockDestinations[3]],
        totalPrice: 70,
        pricePerPerson: 35,
        estimatedDuration: 40,
        maxDeviation: 12,
        vehicleType: 'Van 7 posti',
        departureTime: new Date(Date.now() + 3600000).toISOString(),
        seats: 7,
        score: 82,
      },
    ];

    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nella ricerca di match' },
      { status: 500 }
    );
  }
}