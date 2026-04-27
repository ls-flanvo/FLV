import { NextRequest, NextResponse } from 'next/server';

const AIRPORT_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  CTA: { lat: 37.4668, lng: 15.0664, name: 'Catania Fontanarossa' },
  PMO: { lat: 38.1754, lng: 13.0914, name: 'Palermo Falcone Borsellino' },
  CAG: { lat: 39.2515, lng: 9.0543, name: 'Cagliari Elmas' },
  FCO: { lat: 41.8003, lng: 12.2389, name: 'Roma Fiumicino' },
  MXP: { lat: 45.6301, lng: 8.7233, name: 'Milano Malpensa' },
  BGY: { lat: 45.6714, lng: 9.7042, name: 'Milano Bergamo Orio' },
  LGW: { lat: 51.1537, lng: -0.1821, name: 'London Gatwick' },
  BCN: { lat: 41.2974, lng: 2.0833, name: 'Barcellona El Prat' },
};

const AIRLINE_MAP: Record<string, string> = {
  AZ: 'ITA Airways', FR: 'Ryanair', U2: 'easyJet', VY: 'Vueling',
  W6: 'Wizz Air', BA: 'British Airways', LH: 'Lufthansa', EW: 'Eurowings',
};

async function fetchFromAviationStack(flightCode: string) {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightCode}&limit=1`,
      { next: { revalidate: 300 } } // cache 5 min
    );
    if (!res.ok) return null;
    const data = await res.json();
    const flight = data?.data?.[0];
    if (!flight) return null;

    const arrivalCode = flight.arrival?.iata ?? '';
    const coords = AIRPORT_COORDS[arrivalCode];

    const scheduledTime = flight.departure?.scheduled ?? new Date().toISOString();
    const actualTime = flight.departure?.actual ?? null;
    const delay = flight.departure?.delay ?? 0;

    const statusMap: Record<string, string> = {
      scheduled: 'scheduled', active: 'departed', landed: 'landed',
      cancelled: 'cancelled', incident: 'delayed', diverted: 'diverted',
    };

    return {
      id: flight.flight?.iata ?? flightCode,
      code: flight.flight?.iata ?? flightCode,
      airline: flight.airline?.name ?? 'Compagnia aerea',
      departureAirport: flight.departure?.iata ?? '---',
      arrivalAirport: arrivalCode,
      arrivalAirportName: coords?.name ?? arrivalCode,
      arrivalLat: coords?.lat ?? null,
      arrivalLng: coords?.lng ?? null,
      scheduledTime,
      actualTime,
      delayMins: delay,
      status: statusMap[flight.flight_status] ?? 'scheduled',
      terminal: flight.arrival?.terminal ?? null,
      gate: flight.arrival?.gate ?? null,
    };
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const flightCode = params.code.toUpperCase().replace(/\s/g, '');

    // Prima prova AviationStack (dati reali)
    const realFlight = await fetchFromAviationStack(flightCode);
    if (realFlight) {
      return NextResponse.json({ flight: realFlight, source: 'live' });
    }

    // Fallback: genera volo plausibile per test
    const prefix = flightCode.slice(0, 2);
    const airline = AIRLINE_MAP[prefix] || 'Charter Airlines';
    const targetAirports = ['CTA', 'PMO', 'CAG'];
    const arrivalCode = targetAirports[Math.abs(flightCode.charCodeAt(2) - 48) % 3];
    const arrival = AIRPORT_COORDS[arrivalCode];

    const mockFlight = {
      id: flightCode,
      code: flightCode,
      airline,
      departureAirport: 'LGW',
      arrivalAirport: arrivalCode,
      arrivalAirportName: arrival.name,
      arrivalLat: arrival.lat,
      arrivalLng: arrival.lng,
      scheduledTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      actualTime: null,
      delayMins: 0,
      status: 'scheduled' as const,
      terminal: '1',
      gate: 'A1',
    };

    return NextResponse.json({ flight: mockFlight, source: 'mock' });
  } catch (error) {
    return NextResponse.json({ error: 'Errore nella ricerca del volo' }, { status: 500 });
  }
}
