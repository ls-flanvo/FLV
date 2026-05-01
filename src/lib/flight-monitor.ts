import { prisma } from './prisma';
import { createNotification } from './notify';
import { AIRPORT_COORDS } from './airports';
import { sendAirlineCancellationAssistance } from './email';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const BAGGAGE_WAIT_MINS = 25;
const DELAY_NOTIFY_THRESHOLD_MINS = 15;

// Intervallo di polling adattivo in base alle ore al volo
function adaptiveIntervalMs(minutesUntilPickup: number): number {
  if (minutesUntilPickup > 180) return 60 * 60_000;  // > 3h → ogni 60 min
  if (minutesUntilPickup > 120) return 30 * 60_000;  // 2-3h → ogni 30 min
  if (minutesUntilPickup > 60)  return 15 * 60_000;  // 1-2h → ogni 15 min
  return 10 * 60_000;                                  // < 1h → ogni 10 min
}

interface AviationFlight {
  flight_status: string;
  arrival: { iata: string; scheduled: string; estimated?: string; actual?: string; delay?: number };
}

async function fetchFlightStatus(flightNumber: string): Promise<AviationFlight | null> {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightNumber}&limit=1`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0] ?? null;
  } catch { return null; }
}

export async function monitorActiveFlights() {
  const now = new Date();

  // ── 1. Fallback gruppi senza driver nelle prossime 60 min ──────────────────
  const noDriverGroups = await prisma.rideGroup.findMany({
    where: {
      status: { in: ['CONFIRMED', 'READY'] },
      targetPickupTime: { gte: now, lte: new Date(Date.now() + 60 * 60_000) },
      ride: { is: null },
    },
    include: {
      members: {
        where: { status: { not: 'CANCELLED' } },
        include: { booking: { include: { user: true } } },
      },
    },
  });
  for (const g of noDriverGroups) await handleNoDriver(g);

  // ── 2. Gruppi da monitorare (max 4h al volo, non ancora atterrati) ─────────
  const groups = await prisma.rideGroup.findMany({
    where: {
      status: { in: ['ASSIGNED', 'ACTIVE'] },
      flightStatus: { notIn: ['landed', 'cancelled', 'diverted'] },
      targetPickupTime: { gte: now, lte: new Date(Date.now() + 4 * 3_600_000) },
    },
    include: {
      members: {
        where: { status: { not: 'CANCELLED' } },
        include: { booking: { include: { user: true } } },
      },
      ride: { include: { driver: { include: { user: true } } } },
    },
  });

  // ── 3. Deduplicazione per numero volo ─────────────────────────────────────
  // Una sola chiamata API per tutti i gruppi con lo stesso volo
  const byFlight = new Map<string, typeof groups>();
  for (const g of groups) {
    if (!byFlight.has(g.flightNumber)) byFlight.set(g.flightNumber, []);
    byFlight.get(g.flightNumber)!.push(g);
  }

  for (const [flightNumber, flightGroups] of byFlight) {
    // Calcola intervallo adattivo dalla pickup più imminente del gruppo
    const earliestPickup = Math.min(...flightGroups.map(g => g.targetPickupTime.getTime()));
    const minutesUntil = (earliestPickup - Date.now()) / 60_000;
    const intervalMs = adaptiveIntervalMs(minutesUntil);

    // Verifica se almeno un gruppo è stato controllato abbastanza di recente
    const mostRecentCheck = Math.max(...flightGroups.map(g => g.lastFlightCheck?.getTime() ?? 0));
    if (Date.now() - mostRecentCheck < intervalMs) continue; // ← skip: troppo presto

    // ← UNA sola chiamata API per tutti i gruppi su questo volo
    const flightData = await fetchFlightStatus(flightNumber);

    // Aggiorna tutti i gruppi con i dati appena ricevuti
    for (const group of flightGroups) {
      try { await checkGroup(group, flightData); } catch (e) {
        console.error(`monitorFlight error group ${group.id}:`, e);
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkGroup(group: any, flight: AviationFlight | null) {
  await prisma.rideGroup.update({ where: { id: group.id }, data: { lastFlightCheck: new Date() } });
  if (!flight) return;

  const status = flight.flight_status;
  const arrivalCode = flight.arrival?.iata ?? '';
  const airportInfo = AIRPORT_COORDS[arrivalCode];
  const meetingPoint = airportInfo?.meetingPoint ?? 'Terminal Arrivi — Uscita Bagagli, cartello Flanvo';

  if (status === 'landed') {
    const actualLanding = flight.arrival?.actual ? new Date(flight.arrival.actual) : new Date();
    const meetingTime = new Date(actualLanding.getTime() + BAGGAGE_WAIT_MINS * 60_000);
    await prisma.rideGroup.update({
      where: { id: group.id },
      data: { flightStatus: 'landed', flightActualLanding: actualLanding, meetingTime, meetingPoint },
    });
    const meetingStr = meetingTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    for (const member of group.members) {
      createNotification({
        userId: member.booking.userId,
        type: 'RIDE_STARTED',
        title: `Volo ${group.flightNumber} atterrato`,
        body: `Il driver ti aspetta entro le ${meetingStr}. Punto di incontro: ${meetingPoint}`,
        data: { rideGroupId: group.id, meetingPoint, meetingTime: meetingTime.toISOString() },
      }).catch(() => {});
    }
    const driverRecord = await prisma.driver.findFirst({
      where: { rides: { some: { rideGroup: { id: group.id } } } },
      select: { userId: true },
    });
    if (driverRecord?.userId) {
      createNotification({
        userId: driverRecord.userId,
        type: 'RIDE_STARTED',
        title: `Volo ${group.flightNumber} atterrato`,
        body: `Dirigiti al punto di incontro entro le ${meetingStr}: ${meetingPoint}`,
        data: { rideGroupId: group.id, meetingPoint, meetingTime: meetingTime.toISOString() },
      }).catch(() => {});
    }
    return;
  }

  if (status === 'cancelled' || status === 'diverted') {
    await handleFlightCancelledOrDiverted(group, status);
    return;
  }

  const delayMins = flight.arrival?.delay ?? 0;
  if (delayMins >= (group.delayNotifiedMins ?? 0) + DELAY_NOTIFY_THRESHOLD_MINS) {
    await prisma.rideGroup.update({
      where: { id: group.id },
      data: { flightStatus: 'delayed', delayNotifiedMins: delayMins },
    });
    const estimatedStr = flight.arrival?.estimated
      ? new Date(flight.arrival.estimated).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      : '—';
    for (const member of group.members) {
      createNotification({
        userId: member.booking.userId,
        type: 'RIDE_STARTED',
        title: `⏱ Volo ${group.flightNumber} in ritardo`,
        body: `Nuovo arrivo stimato: ${estimatedStr} (+${delayMins} min). Driver avvisato.`,
        data: { rideGroupId: group.id, delayMins },
      }).catch(() => {});
    }
    const driverRecord = await prisma.driver.findFirst({
      where: { rides: { some: { rideGroup: { id: group.id } } } },
      select: { userId: true },
    });
    if (driverRecord?.userId) {
      createNotification({
        userId: driverRecord.userId,
        type: 'RIDE_STARTED',
        title: `⏱ Volo ${group.flightNumber} in ritardo (+${delayMins} min)`,
        body: `Nuovo arrivo stimato: ${estimatedStr}. Non partire prima!`,
        data: { rideGroupId: group.id, delayMins },
      }).catch(() => {});
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleNoDriver(group: any) {
  await prisma.rideGroup.update({ where: { id: group.id }, data: { status: 'CANCELLED' } });
  for (const member of group.members) {
    const m = await prisma.groupMember.findUnique({
      where: { id: member.id }, select: { paymentIntentId: true, paymentStatus: true },
    });
    if (m?.paymentIntentId && m.paymentStatus === 'AUTHORIZED') {
      stripe.paymentIntents.cancel(m.paymentIntentId).catch(() => {});
    }
    await prisma.groupMember.update({
      where: { id: member.id },
      data: { status: 'CANCELLED', paymentStatus: m?.paymentStatus === 'AUTHORIZED' ? 'REFUNDED' : m?.paymentStatus ?? 'PENDING' },
    });
    await prisma.booking.updateMany({ where: { groupMember: { id: member.id } }, data: { status: 'CANCELLED' } });
    createNotification({
      userId: member.booking.userId,
      type: 'BOOKING_CANCELLED',
      title: 'Nessun driver disponibile',
      body: `Non è stato possibile trovare un driver per il volo ${group.flightNumber}. Rimborso completo in elaborazione.`,
      data: { rideGroupId: group.id },
    }).catch(() => {});
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleFlightCancelledOrDiverted(group: any, reason: 'cancelled' | 'diverted') {
  await prisma.rideGroup.update({ where: { id: group.id }, data: { flightStatus: reason, status: 'CANCELLED' } });

  const reasonLabel = reason === 'cancelled' ? 'cancellato' : 'dirottato';
  const title = `Volo ${group.flightNumber} ${reasonLabel} — procedura assistenza attivata`;
  const body = reason === 'cancelled'
    ? `Il volo ${group.flightNumber} è stato cancellato dalla compagnia aerea. Ti abbiamo inviato le istruzioni per richiedere il rimborso all'airline tramite Reg. UE 261/2004.`
    : `Il volo ${group.flightNumber} è stato dirottato. Ti abbiamo inviato le istruzioni per richiedere il rimborso all'airline tramite Reg. UE 261/2004.`;

  for (const member of group.members) {
    const m = await prisma.groupMember.findUnique({
      where: { id: member.id },
      select: { id: true, paymentIntentId: true, paymentStatus: true, totalPrice: true },
    });

    // Rilascia la pre-autorizzazione Stripe (necessità tecnica — il servizio non verrà erogato)
    if (m?.paymentIntentId && m.paymentStatus === 'AUTHORIZED') {
      stripe.paymentIntents.cancel(m.paymentIntentId).catch(() => {});
    }

    await prisma.groupMember.update({
      where: { id: member.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: m?.paymentStatus === 'AUTHORIZED' ? 'REFUNDED' : m?.paymentStatus ?? 'PENDING',
      },
    });

    const booking = await prisma.booking.findFirst({
      where: { groupMember: { id: member.id } },
      select: { id: true, userId: true, pickupTime: true },
    });

    if (booking) {
      await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });

      // Crea automaticamente una disputa "airline" per ogni passeggero
      await prisma.dispute.create({
        data: {
          bookingId: booking.id,
          userId: booking.userId,
          reason: reason === 'cancelled' ? 'AIRLINE_CANCELLED' : 'AIRLINE_DIVERTED',
          description: `Procedura automatica: volo ${group.flightNumber} ${reasonLabel} dalla compagnia aerea. Assistenza per rimborso EU 261/2004 attivata.`,
          status: 'PENDING',
        },
      }).catch(() => {});

      // Invia email assistenza airline con ricevuta e istruzioni
      const user = await prisma.user.findUnique({ where: { id: booking.userId }, select: { email: true, name: true } });
      if (user) {
        sendAirlineCancellationAssistance(user.email, {
          userName: user.name ?? 'Passeggero',
          flightNumber: group.flightNumber,
          reason,
          bookingId: booking.id,
          amount: m?.totalPrice ?? 0,
          pickupDate: booking.pickupTime.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
        }).catch(() => {});
      }
    }

    // Notifica in-app
    createNotification({
      userId: member.booking.userId,
      type: 'BOOKING_CANCELLED',
      title,
      body,
      data: { rideGroupId: group.id, reason, assistanceActivated: true },
    }).catch(() => {});
  }
}
