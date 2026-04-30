import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
//  CREDENZIALI (password unica: Test2026!)
// ─────────────────────────────────────────────
//  admin@flanvo.com        → /admin/login
//  driver@flanvo.com       → /driver/login  (van FL001VN, già verificato)
//  p1@flanvo.com           → Scenario 3: aggiunge 3 pax al gruppo esistente
//  p2@flanvo.com           → pre-inserito nel gruppo (1 pax, Corso Umberto)
//  p3@flanvo.com           → pre-inserito nel gruppo (2 pax, Via Etnea)
//  p4@flanvo.com           → pre-inserito nel gruppo (1 pax, Piazza Duomo)
//  p5@flanvo.com           → Scenario 2: trova il gruppo e si unisce (2 pax)
//  p6@flanvo.com           → Scenario 1: volo diverso, nessun gruppo
//  p7@flanvo.com           → Scenario 5: prenota e cancella
//
//  VOLI:
//  AZ1234 → gruppo FORMING con 4 pax (p2+p3+p4) — usato per scenari 2,3,4
//  AZ9999 → nessun gruppo — usato per scenario 1
// ─────────────────────────────────────────────

const CTA = { lat: 37.4668, lng: 15.0664 };
const TOMORROW_14 = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(14, 0, 0, 0);
  return d;
};

async function main() {
  console.log('Pulizia database...');
  await prisma.priceAuditLog.deleteMany();
  await prisma.supplyCheck.deleteMany();
  await prisma.groupRoute.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.rideGroup.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.microGroup.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.airport.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemConfig.deleteMany();
  console.log('Database pulito.\n');

  const hash = await bcrypt.hash('Test2026!', 10);

  // ── ADMIN ──────────────────────────────────
  await prisma.user.create({
    data: { email: 'admin@flanvo.com', name: 'Admin Flanvo', phone: '+39 000 0000000', role: 'ADMIN', isVerified: true, password: hash },
  });

  // ── DRIVER ─────────────────────────────────
  const driverUser = await prisma.user.create({
    data: { email: 'driver@flanvo.com', name: 'Marco Autista', phone: '+39 333 1111111', role: 'DRIVER', isVerified: true, password: hash },
  });
  await prisma.driver.create({
    data: {
      userId: driverUser.id,
      licenseNumber: 'AB123456CD',
      vehicleType: 'VAN',
      vehiclePlate: 'FL001VN',
      vehicleModel: 'Mercedes-Benz Vito',
      vehicleYear: 2022,
      vehicleColor: 'Nero',
      rating: 4.9,
      totalRides: 0,
      isVerified: true,
      isAvailable: true,
      totalEarnings: 0,
    },
  });

  // ── PASSEGGERI ──────────────────────────────
  const paxData = [
    { email: 'p1@flanvo.com', name: 'Alice Romano' },
    { email: 'p2@flanvo.com', name: 'Bruno Esposito' },
    { email: 'p3@flanvo.com', name: 'Carla Marino' },
    { email: 'p4@flanvo.com', name: 'Davide Greco' },
    { email: 'p5@flanvo.com', name: 'Elena Ricci' },
    { email: 'p6@flanvo.com', name: 'Fabio Costa' },
    { email: 'p7@flanvo.com', name: 'Giulia Serra' },
  ];
  const pax: Record<string, { id: string; name: string }> = {};
  for (const p of paxData) {
    const u = await prisma.user.create({
      data: { ...p, phone: '+39 320 0000000', role: 'PASSENGER', isVerified: true, password: hash },
    });
    pax[p.email.split('@')[0]] = { id: u.id, name: u.name };
  }

  // ── AEROPORTI ───────────────────────────────
  await prisma.airport.createMany({
    data: [
      { code: 'CTA', name: 'Catania Fontanarossa', city: 'Catania', country: 'Italy', latitude: CTA.lat, longitude: CTA.lng, timezone: 'Europe/Rome' },
      { code: 'FCO', name: 'Roma Fiumicino', city: 'Roma', country: 'Italy', latitude: 41.8003, longitude: 12.2389, timezone: 'Europe/Rome' },
    ],
  });

  // ── SYSTEM CONFIG ────────────────────────────
  await prisma.systemConfig.createMany({
    data: [
      { key: 'driver_rate_per_km',   value: '2.00',  description: 'Driver rate (€/km)' },
      { key: 'flanvo_tier1_rate',    value: '0.30',  description: 'Fee tier 1 — 0–50 km' },
      { key: 'flanvo_tier2_rate',    value: '0.25',  description: 'Fee tier 2 — 51–99 km' },
      { key: 'flanvo_tier3_rate',    value: '0.20',  description: 'Fee tier 3 — ≥100 km' },
      { key: 'protection_fee',       value: '2.50',  description: 'Protection fee (€)' },
      { key: 'matching_window_hours',value: '3',     description: 'Ore prima volo per chiusura' },
      { key: 'GROUP_MAX_PAX',        value: '7',     description: 'Max passeggeri per gruppo' },
      { key: 'MAX_DETOUR_PERCENT',   value: '20.0',  description: 'Max deviazione %' },
      { key: 'MAX_DETOUR_MINUTES',   value: '10',    description: 'Max tempo extra min' },
    ],
  });

  // ─────────────────────────────────────────────
  //  GRUPPO PRE-ESISTENTE — AZ1234 (4 pax)
  //  Usato per Scenari 2, 3, 4
  //  p2 (1 pax) + p3 (2 pax) + p4 (1 pax) = 4 pax
  //  Destinazioni: tutte Catania centro (~6-9 km da CTA)
  // ─────────────────────────────────────────────
  const flightTime = TOMORROW_14();

  const group = await prisma.rideGroup.create({
    data: {
      flightNumber: 'AZ1234',
      arrivalAirport: 'CTA',
      direction: 'FROM_AIRPORT',
      targetPickupTime: flightTime,
      basePrice: 0,
      status: 'FORMING',
      currentCapacity: 4,
      currentLuggage: 4,
      maxCapacity: 7,
      qualityScore: 80,
    },
  });

  const destinations = [
    // p2: 1 pax — Corso Umberto (~6.5 km da CTA)
    { userId: pax.p2.id, name: pax.p2.name, pax: 1, lug: 1, addr: 'Corso Umberto I, 95100 Catania CT, Italia', lat: 37.5079, lng: 15.0836 },
    // p3: 2 pax — Via Etnea (~7.5 km da CTA)
    { userId: pax.p3.id, name: pax.p3.name, pax: 2, lug: 2, addr: 'Via Etnea, 95121 Catania CT, Italia', lat: 37.5127, lng: 15.0870 },
    // p4: 1 pax — Piazza Duomo (~6.8 km da CTA)
    { userId: pax.p4.id, name: pax.p4.name, pax: 1, lug: 1, addr: 'Piazza del Duomo, 95121 Catania CT, Italia', lat: 37.5025, lng: 15.0871 },
  ];

  for (let i = 0; i < destinations.length; i++) {
    const d = destinations[i];
    const booking = await prisma.booking.create({
      data: {
        userId: d.userId,
        pickupLocation: 'Aeroporto di Catania Fontanarossa',
        pickupLat: CTA.lat,
        pickupLng: CTA.lng,
        dropoffLocation: d.addr,
        dropoffLat: d.lat,
        dropoffLng: d.lng,
        pickupTime: flightTime,
        flightNumber: 'AZ1234',
        flightDate: flightTime,
        direction: 'FROM_AIRPORT',
        passengers: d.pax,
        luggage: d.lug,
        passengerName: d.name,
        status: 'PENDING',
        isGroupRide: true,
        maxDetourMinutes: 10,
        maxDetourPercent: 20,
      },
    });
    await prisma.groupMember.create({
      data: {
        bookingId: booking.id,
        rideGroupId: group.id,
        status: 'PENDING',
        pickupOrder: i + 1,
        dropoffOrder: i + 1,
        paymentStatus: 'PENDING',
      },
    });
  }

  // ─────────────────────────────────────────────
  //  SCENARIO 5 — p7 ha una prenotazione PENDING
  //  per AZ1234 (stesso volo, gruppo diverso)
  //  La cancellerà durante il test
  // ─────────────────────────────────────────────
  const groupForP7 = await prisma.rideGroup.create({
    data: {
      flightNumber: 'AZ1234',
      arrivalAirport: 'CTA',
      direction: 'FROM_AIRPORT',
      targetPickupTime: flightTime,
      basePrice: 0,
      status: 'FORMING',
      currentCapacity: 1,
      currentLuggage: 1,
      maxCapacity: 7,
      qualityScore: 75,
    },
  });

  const bookingP7 = await prisma.booking.create({
    data: {
      userId: pax.p7.id,
      pickupLocation: 'Aeroporto di Catania Fontanarossa',
      pickupLat: CTA.lat,
      pickupLng: CTA.lng,
      dropoffLocation: 'Viale Mario Rapisardi, 95100 Catania CT, Italia',
      dropoffLat: 37.5195,
      dropoffLng: 15.0792,
      pickupTime: flightTime,
      flightNumber: 'AZ1234',
      flightDate: flightTime,
      direction: 'FROM_AIRPORT',
      passengers: 1,
      luggage: 1,
      passengerName: pax.p7.name,
      status: 'PENDING',
      isGroupRide: true,
      maxDetourMinutes: 10,
      maxDetourPercent: 20,
    },
  });
  await prisma.groupMember.create({
    data: {
      bookingId: bookingP7.id,
      rideGroupId: groupForP7.id,
      status: 'PENDING',
      pickupOrder: 1,
      dropoffOrder: 1,
      paymentStatus: 'PENDING',
    },
  });

  console.log('✅ Seed completato.\n');
  console.log('PASSWORD UNICA: Test2026!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('admin@flanvo.com     → admin dashboard');
  console.log('driver@flanvo.com    → driver dashboard (van FL001VN)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SCENARIO 1 — Primo arrivato (volo senza gruppo)');
  console.log('  p6@flanvo.com  →  cerca AZ9999  →  nessun gruppo');
  console.log('');
  console.log('SCENARIO 2 — Trovare un gruppo esistente');
  console.log('  p5@flanvo.com  →  cerca AZ1234  →  trova gruppo (4 pax)  →  si unisce (2 pax)');
  console.log('');
  console.log('SCENARIO 3 — Van pieno, chiusura immediata');
  console.log('  p1@flanvo.com  →  cerca AZ1234  →  trova gruppo (6 pax)  →  aggiunge 1 pax  →  7/7  →  MATCHED');
  console.log('');
  console.log('SCENARIO 4 — Pagamento + driver');
  console.log('  tutti i passeggeri del gruppo pagano (Stripe: 4242 4242 4242 4242 · 12/29 · 123)');
  console.log('  driver@flanvo.com  →  vede compenso reale  →  accetta');
  console.log('');
  console.log('SCENARIO 5 — Cancellazione');
  console.log('  p7@flanvo.com  →  ha prenotazione PENDING  →  la cancella  →  rimborso completo');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error('Seed fallito:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
