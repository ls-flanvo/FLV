import { NextRequest, NextResponse } from 'next/server';
import { AIRPORT_COORDS } from '@/lib/airports';

const AIRLINE_MAP: Record<string, string> = {
  AZ: 'ITA Airways', FR: 'Ryanair', U2: 'easyJet', VY: 'Vueling',
  W6: 'Wizz Air', BA: 'British Airways', LH: 'Lufthansa', EW: 'Eurowings',
  IG: 'Air Italy', TO: 'Transavia', PC: 'Pegasus', SU: 'Aeroflot',
};

async function fetchFromAviationStack(flightCode: string) {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightCode}&limit=1`,
      { next: { revalidate: 180 } } // cache 3 min
    );
    if (!res.ok) return null;
    const data = await res.json();
    const flight = data?.data?.[0];
    if (!flight) return null;

    const arrivalCode = flight.arrival?.iata ?? '';
    const coords = AIRPORT_COORDS[arrivalCode];

    const scheduledTime = flight.arrival?.scheduled ?? new Date().toISOString();
    const actualTime = flight.arrival?.actual ?? null;
    const delay = flight.arrival?.delay ?? 0;

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

    if (!/^[A-Z0-9]{2}[0-9]{1,4}$/.test(flightCode)) {
      return NextResponse.json(
        { error: 'Formato codice volo non valido. Esempio: AZ1234' },
        { status: 400 }
      );
    }

    // Prova AviationStack (dati reali)
    const realFlight = await fetchFromAviationStack(flightCode);
    if (realFlight) {
      return NextResponse.json({ flight: realFlight, source: 'live' });
    }

    // Fallback demo con aeroporto reale basato sul prefisso
    const prefix = flightCode.slice(0, 2);
    const airline = AIRLINE_MAP[prefix] || 'Test Airlines';

    // Determina aeroporto d'arrivo in base all'airline/volo (logica demo)
    const DEMO_ROUTES: Record<string, string> = {
      AZ: 'CTA', FR: 'PMO', U2: 'CTA', VY: 'CAG',
      W6: 'PMO', IG: 'CTA', TO: 'PMO',
    };
    const arrivalCode = DEMO_ROUTES[prefix] || 'CTA';
    const arrival = AIRPORT_COORDS[arrivalCode];

    // Orario realistico: tra 1 e 6 ore
    const hoursOffset = 1 + (parseInt(flightCode.slice(-1)) % 5);
    const scheduledTime = new Date(Date.now() + hoursOffset * 3600000).toISOString();

    return NextResponse.json({
      flight: {
        id: flightCode,
        code: flightCode,
        airline,
        departureAirport: 'LGW',
        arrivalAirport: arrivalCode,
        arrivalAirportName: arrival.name,
        arrivalLat: arrival.lat,
        arrivalLng: arrival.lng,
        scheduledTime,
        actualTime: null,
        delayMins: 0,
        status: 'scheduled' as const,
        terminal: '1',
        gate: `A${parseInt(flightCode.slice(-2)) % 20 + 1}`,
      },
      source: 'demo',
    });
  } catch {
    return NextResponse.json({ error: 'Errore nella ricerca del volo' }, { status: 500 });
  }
}
