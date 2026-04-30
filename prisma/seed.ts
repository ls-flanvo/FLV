import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Credenziali di test — password comune: Test2026!
// Admin:      admin@flanvo.com
// Driver:     driver@flanvo.com  (già verificato)
// Passeggeri: p1@flanvo.com … p7@flanvo.com

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

  console.log('Database pulito.');

  const hash = await bcrypt.hash('Test2026!', 10);

  // ── ADMIN ──────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: 'admin@flanvo.com',
      name: 'Admin Flanvo',
      phone: '+39 000 0000000',
      role: 'ADMIN',
      isVerified: true,
      password: hash,
    },
  });
  console.log('Admin creato: admin@flanvo.com / Test2026!');

  // ── DRIVER (già verificato per testare subito) ──────
  const driverUser = await prisma.user.create({
    data: {
      email: 'driver@flanvo.com',
      name: 'Marco Autista',
      phone: '+39 333 1111111',
      role: 'DRIVER',
      isVerified: true,
      password: hash,
    },
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
      totalEarnings: 0,
    },
  });
  console.log('Driver creato: driver@flanvo.com / Test2026!');

  // ── PASSEGGERI (7 per riempire un van) ─────────────
  const passengers = [
    { email: 'p1@flanvo.com', name: 'Alice Romano' },
    { email: 'p2@flanvo.com', name: 'Bruno Esposito' },
    { email: 'p3@flanvo.com', name: 'Carla Marino' },
    { email: 'p4@flanvo.com', name: 'Davide Greco' },
    { email: 'p5@flanvo.com', name: 'Elena Ricci' },
    { email: 'p6@flanvo.com', name: 'Fabio Costa' },
    { email: 'p7@flanvo.com', name: 'Giulia Serra' },
  ];

  for (const p of passengers) {
    await prisma.user.create({
      data: {
        ...p,
        phone: '+39 320 0000000',
        role: 'PASSENGER',
        isVerified: true,
        password: hash,
      },
    });
  }
  console.log('7 passeggeri creati: p1@flanvo.com … p7@flanvo.com / Test2026!');

  // ── AEROPORTI ───────────────────────────────────────
  await prisma.airport.createMany({
    data: [
      { code: 'CTA', name: 'Catania Fontanarossa', city: 'Catania', country: 'Italy', latitude: 37.4668, longitude: 15.0664, timezone: 'Europe/Rome' },
      { code: 'FCO', name: 'Roma Fiumicino', city: 'Roma', country: 'Italy', latitude: 41.8003, longitude: 12.2389, timezone: 'Europe/Rome' },
      { code: 'MXP', name: 'Milano Malpensa', city: 'Milano', country: 'Italy', latitude: 45.6301, longitude: 8.7233, timezone: 'Europe/Rome' },
    ],
  });
  console.log('Aeroporti creati: CTA, FCO, MXP');

  // ── SYSTEM CONFIG ───────────────────────────────────
  await prisma.systemConfig.createMany({
    data: [
      { key: 'driver_rate_per_km',      value: '2.00',  description: 'Driver rate (€/km)' },
      { key: 'flanvo_tier1_rate',        value: '0.30',  description: 'Fee tier 1 — 0–50 km (€/km)' },
      { key: 'flanvo_tier2_rate',        value: '0.25',  description: 'Fee tier 2 — 51–99 km (€/km)' },
      { key: 'flanvo_tier3_rate',        value: '0.20',  description: 'Fee tier 3 — ≥100 km (€/km)' },
      { key: 'protection_fee',           value: '2.50',  description: 'Flanvo protection fee (€)' },
      { key: 'matching_window_hours',    value: '3',     description: 'Ore prima del volo per chiudere il gruppo' },
      { key: 'DBSCAN_EPS',              value: '8.5',   description: 'DBSCAN epsilon (km)' },
      { key: 'DBSCAN_MIN_SAMPLES',      value: '2',     description: 'DBSCAN min samples' },
      { key: 'GROUP_MAX_PAX',           value: '7',     description: 'Max passeggeri per gruppo' },
      { key: 'MAX_DETOUR_PERCENT',      value: '20.0',  description: 'Max deviazione (%)' },
      { key: 'MAX_DETOUR_MINUTES',      value: '10',    description: 'Max tempo extra (min)' },
    ],
  });
  console.log('System config creato.');

  console.log('\n✅ Seed completato.\n');
  console.log('CREDENZIALI DI TEST (password: Test2026!)');
  console.log('------------------------------------------');
  console.log('Admin:    admin@flanvo.com');
  console.log('Driver:   driver@flanvo.com  (verificato, van FL001VN)');
  console.log('Pax 1–7:  p1@flanvo.com … p7@flanvo.com');
  console.log('\nStripe test card: 4242 4242 4242 4242 | exp: 12/29 | cvc: 123');
}

main()
  .catch((e) => {
    console.error('Seed fallito:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
