import { NextRequest, NextResponse } from 'next/server';
import { mockVehicles, mockDestinations } from '@/lib/mockData';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const trackingData = {
      bookingId: params.id,
      vehicle: mockVehicles[0],
      currentLocation: {
        lat: 45.5500,
        lng: 9.0000,
      },
      destination: mockDestinations[0],
      estimatedArrival: new Date(Date.now() + 1800000).toISOString(),
      status: 'in_progress',
      driver: {
        name: 'Antonio Esposito',
        phone: '+39 333 9876543',
        rating: 4.8,
      },
      route: [
        { lat: 45.6301, lng: 8.7233 },
        { lat: 45.5800, lng: 8.8500 },
        { lat: 45.5500, lng: 9.0000 },
        { lat: 45.4777, lng: 9.2060 },
      ],
    };

    return NextResponse.json({ tracking: trackingData });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nel tracking' },
      { status: 500 }
    );
  }
}