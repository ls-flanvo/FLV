import { NextRequest, NextResponse } from 'next/server';
import { mockFlights } from '@/lib/mockData';

// Aeroporti Flanvo target MVP: CTA, PMO, CAG
const AIRPORT_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  CTA: { lat: 37.4668, lng: 15.0664, name: 'Catania Fontanarossa' },
  PMO: { lat: 38.1754, lng: 13.0914, name: 'Palermo Falcone Borsellino' },
  CAG: { lat: 39.2515, lng: 9.0543, name: 'Cagliari Elmas' },
  FCO: { lat: 41.8003, lng: 12.2389, name: 'Roma Fiumicino' },
  MXP: { lat: 45.6301, lng: 8.7233, name: 'Milano Malpensa' },
  BGY: { lat: 45.6714, lng: 9.7042, name: 'Milano Bergamo Orio' },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const flightCode = params.code.toUpperCase();
    const flight = mockFlights.find((f) => f.code === flightCode);

    if (flight) {
      return NextResponse.json({ flight });
    }

    // Genera un volo plausibile per qualsiasi codice inserito
    const prefix = flightCode.slice(0, 2);
    const airlineMap: Record<string, string> = {
      AZ: 'ITA Airways', FR: 'Ryanair', U2: 'easyJet', VY: 'Vueling',
      W6: 'Wizz Air', BA: 'British Airways', LH: 'Lufthansa', EW: 'Eurowings',
    };
    const airline = airlineMap[prefix] || 'Charter Airlines';

    // Assegna un aeroporto di arrivo casuale tra i target
    const targetAirports = ['CTA', 'PMO', 'CAG'];
    const arrivalCode = targetAirports[Math.floor(Math.random() * targetAirports.length)];
    const arrival = AIRPORT_COORDS[arrivalCode];

    const generatedFlight = {
      id: `gen-${flightCode}`,
      code: flightCode,
      airline,
      departureAirport: 'LGW',
      arrivalAirport: arrivalCode,
      scheduledTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      delayMins: 0,
      status: 'scheduled' as const,
      terminal: '1',
      gate: 'A1',
      // Coordinate aeroporto arrivo (usate per matching)
      arrivalLat: arrival.lat,
      arrivalLng: arrival.lng,
      arrivalAirportName: arrival.name,
    };

    return NextResponse.json({ flight: generatedFlight });
  } catch (error) {
    return NextResponse.json({ error: 'Errore nella ricerca del volo' }, { status: 500 });
  }
}
