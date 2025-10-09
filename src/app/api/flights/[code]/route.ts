import { NextRequest, NextResponse } from 'next/server';
import { mockFlights } from '@/lib/mockData';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const flightCode = params.code.toUpperCase();
    const flight = mockFlights.find(f => f.code === flightCode);

    if (!flight) {
      const mockFlight = {
        id: 'f-' + Date.now(),
        code: flightCode,
        airline: 'Mock Airlines',
        departureAirport: 'XXX',
        arrivalAirport: 'YYY',
        scheduledTime: new Date(Date.now() + 3600000).toISOString(),
        delayMins: 0,
        status: 'scheduled' as const,
        terminal: '1',
        gate: 'A1',
      };
      return NextResponse.json({ flight: mockFlight });
    }

    return NextResponse.json({ flight });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore nella ricerca del volo' },
      { status: 500 }
    );
  }
}