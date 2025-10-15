#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function execCommand(command, description) {
  log('');
  log('⏳ ' + description + '...', 'blue');
  try {
    execSync(command, { stdio: 'inherit' });
    log('✅ ' + description + ' - Completato!', 'green');
    return true;
  } catch (error) {
    log('❌ Errore durante: ' + description, 'red');
    log('Comando fallito: ' + command, 'red');
    return false;
  }
}

function createBackup() {
  log('');
  log('📦 FASE 1: Backup dello schema esistente', 'bright');
  
  const backupDir = path.join(process.cwd(), 'backup_schema');
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  if (fs.existsSync(schemaPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, 'schema.prisma.backup-' + timestamp);
    fs.copyFileSync(schemaPath, backupPath);
    log('✅ Backup salvato in: ' + backupPath, 'green');
  } else {
    log('⚠️  Nessuno schema esistente trovato (primo setup)', 'yellow');
  }
}

function createNewSchema() {
  log('');
  log('📝 FASE 2: Creazione nuovo schema', 'bright');
  
  const schemaLines = [
    '// Flanvo - Airport Ride Sharing Platform',
    '// Database: PostgreSQL',
    '// ORM: Prisma',
    '',
    'generator client {',
    '  provider = "prisma-client-js"',
    '}',
    '',
    'datasource db {',
    '  provider = "postgresql"',
    '  url      = env("DATABASE_URL")',
    '  directUrl = env("DIRECT_URL")',
    '}',
    '',
    '// ============================================',
    '// ENUMS',
    '// ============================================',
    '',
    'enum UserRole {',
    '  PASSENGER',
    '  DRIVER',
    '  ADMIN',
    '}',
    '',
    'enum BookingStatus {',
    '  PENDING',
    '  CONFIRMED',
    '  IN_PROGRESS',
    '  COMPLETED',
    '  CANCELLED',
    '}',
    '',
    'enum RideStatus {',
    '  SCHEDULED',
    '  DRIVER_ASSIGNED',
    '  DRIVER_EN_ROUTE',
    '  PICKUP_ARRIVED',
    '  IN_PROGRESS',
    '  COMPLETED',
    '  CANCELLED',
    '}',
    '',
    'enum GroupStatus {',
    '  FORMING',
    '  READY',
    '  ACTIVE',
    '  COMPLETED',
    '  CANCELLED',
    '}',
    '',
    'enum MemberStatus {',
    '  PENDING',
    '  CONFIRMED',
    '  CANCELLED',
    '}',
    '',
    'enum RoutePointType {',
    '  AIRPORT',
    '  PICKUP',
    '  DROPOFF',
    '}',
    '',
    'enum Direction {',
    '  TO_AIRPORT',
    '  FROM_AIRPORT',
    '}',
    '',
    'enum VehicleType {',
    '  SEDAN',
    '  SUV',
    '  VAN',
    '  LUXURY',
    '}',
    '',
    '// ============================================',
    '// CORE ENTITIES',
    '// ============================================',
    '',
    'model User {',
    '  id            String    @id @default(cuid())',
    '  email         String    @unique',
    '  name          String',
    '  phone         String',
    '  role          UserRole  @default(PASSENGER)',
    '  avatar        String?',
    '  isVerified    Boolean   @default(false)',
    '  createdAt     DateTime  @default(now())',
    '  updatedAt     DateTime  @updatedAt',
    '',
    '  bookings      Booking[]',
    '  driver        Driver?',
    '  ',
    '  @@index([email])',
    '  @@map("users")',
    '}',
    '',
    'model Driver {',
    '  id              String       @id @default(cuid())',
    '  userId          String       @unique',
    '  licenseNumber   String       @unique',
    '  vehicleType     VehicleType',
    '  vehiclePlate    String       @unique',
    '  vehicleModel    String',
    '  vehicleYear     Int',
    '  vehicleColor    String',
    '  rating          Float        @default(5.0)',
    '  totalRides      Int          @default(0)',
    '  isAvailable     Boolean      @default(true)',
    '  isVerified      Boolean      @default(false)',
    '  createdAt       DateTime     @default(now())',
    '  updatedAt       DateTime     @updatedAt',
    '',
    '  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)',
    '  rides           Ride[]',
    '  ',
    '  @@index([isAvailable, vehicleType])',
    '  @@index([licenseNumber])',
    '  @@map("drivers")',
    '}',
    '',
    'model Booking {',
    '  id                String         @id @default(cuid())',
    '  userId            String',
    '  ',
    '  pickupLocation    String',
    '  pickupLat         Float',
    '  pickupLng         Float',
    '  dropoffLocation   String',
    '  dropoffLat        Float',
    '  dropoffLng        Float',
    '  pickupTime        DateTime',
    '  ',
    '  flightNumber      String?',
    '  flightTime        DateTime?',
    '  direction         Direction',
    '  ',
    '  passengers        Int            @default(1)',
    '  luggage           Int            @default(1)',
    '  specialRequests   String?',
    '  ',
    '  estimatedPrice    Float?',
    '  finalPrice        Float?',
    '  distance          Float?',
    '  ',
    '  status            BookingStatus  @default(PENDING)',
    '  isGroupRide       Boolean        @default(false)',
    '  ',
    '  createdAt         DateTime       @default(now())',
    '  updatedAt         DateTime       @updatedAt',
    '',
    '  user              User           @relation(fields: [userId], references: [id], onDelete: Cascade)',
    '  ride              Ride?',
    '  groupMemberships  GroupMember[]',
    '  priceBreakdowns   PriceBreakdown[]',
    '  ',
    '  @@index([userId])',
    '  @@index([status])',
    '  @@index([flightNumber])',
    '  @@index([pickupTime])',
    '  @@index([isGroupRide])',
    '  @@map("bookings")',
    '}',
    '',
    'model Ride {',
    '  id              String       @id @default(cuid())',
    '  ',
    '  driverId        String?',
    '  vehicleType     VehicleType',
    '  ',
    '  bookingId       String?      @unique',
    '  rideGroupId     String?      @unique',
    '  ',
    '  status          RideStatus   @default(SCHEDULED)',
    '  scheduledTime   DateTime',
    '  startTime       DateTime?',
    '  endTime         DateTime?',
    '  ',
    '  totalPrice      Float',
    '  totalDistance   Float',
    '  ',
    '  driverNotes     String?',
    '  ',
    '  createdAt       DateTime     @default(now())',
    '  updatedAt       DateTime     @updatedAt',
    '',
    '  driver          Driver?      @relation(fields: [driverId], references: [id], onDelete: SetNull)',
    '  booking         Booking?     @relation(fields: [bookingId], references: [id], onDelete: Cascade)',
    '  rideGroup       RideGroup?   @relation(fields: [rideGroupId], references: [id], onDelete: Cascade)',
    '  ',
    '  @@index([driverId])',
    '  @@index([status])',
    '  @@index([scheduledTime])',
    '  @@index([bookingId])',
    '  @@index([rideGroupId])',
    '  @@map("rides")',
    '}',
    '',
    'model RideGroup {',
    '  id                String        @id @default(cuid())',
    '  ',
    '  direction         Direction',
    '  status            GroupStatus   @default(FORMING)',
    '  ',
    '  maxCapacity       Int           @default(7)',
    '  currentCapacity   Int           @default(0)',
    '  currentLuggage    Int           @default(0)',
    '  ',
    '  targetPickupTime  DateTime',
    '  actualStartTime   DateTime?',
    '  actualEndTime     DateTime?',
    '  ',
    '  basePrice         Float',
    '  totalPrice        Float?',
    '  ',
    '  totalDistance     Float?',
    '  estimatedDuration Int?',
    '  ',
    '  createdAt         DateTime      @default(now())',
    '  updatedAt         DateTime      @updatedAt',
    '',
    '  members           GroupMember[]',
    '  routes            GroupRoute[]',
    '  ride              Ride?',
    '  priceBreakdowns   PriceBreakdown[]',
    '  ',
    '  @@index([status])',
    '  @@index([direction])',
    '  @@index([targetPickupTime])',
    '  @@map("ride_groups")',
    '}',
    '',
    'model GroupMember {',
    '  id              String        @id @default(cuid())',
    '  ',
    '  bookingId       String',
    '  rideGroupId     String',
    '  ',
    '  status          MemberStatus  @default(PENDING)',
    '  memberOrder     Int',
    '  ',
    '  estimatedPickupTime   DateTime?',
    '  actualPickupTime      DateTime?',
    '  estimatedDropoffTime  DateTime?',
    '  actualDropoffTime     DateTime?',
    '  ',
    '  distanceInRoute Float?',
    '  ',
    '  joinedAt        DateTime      @default(now())',
    '  updatedAt       DateTime      @updatedAt',
    '',
    '  booking         Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)',
    '  rideGroup       RideGroup     @relation(fields: [rideGroupId], references: [id], onDelete: Cascade)',
    '  ',
    '  @@unique([bookingId, rideGroupId])',
    '  @@index([rideGroupId])',
    '  @@index([status])',
    '  @@index([memberOrder])',
    '  @@map("group_members")',
    '}',
    '',
    'model GroupRoute {',
    '  id              String          @id @default(cuid())',
    '  ',
    '  rideGroupId     String',
    '  sequence        Int',
    '  type            RoutePointType',
    '  ',
    '  address         String',
    '  latitude        Float',
    '  longitude       Float',
    '  ',
    '  estimatedTime   DateTime',
    '  actualTime      DateTime?',
    '  ',
    '  bookingId       String?',
    '  ',
    '  distanceFromPrevious Float?',
    '  ',
    '  createdAt       DateTime        @default(now())',
    '',
    '  rideGroup       RideGroup       @relation(fields: [rideGroupId], references: [id], onDelete: Cascade)',
    '  ',
    '  @@unique([rideGroupId, sequence])',
    '  @@index([rideGroupId])',
    '  @@map("group_routes")',
    '}',
    '',
    'model PriceBreakdown {',
    '  id              String    @id @default(cuid())',
    '  ',
    '  bookingId       String',
    '  rideGroupId     String?',
    '  ',
    '  basePrice       Float',
    '  distanceFee     Float',
    '  timeFee         Float     @default(0)',
    '  airportFee      Float     @default(0)',
    '  surcharges      Float     @default(0)',
    '  discount        Float     @default(0)',
    '  ',
    '  sharePercentage Float?',
    '  savings         Float     @default(0)',
    '  ',
    '  finalPrice      Float',
    '  ',
    '  createdAt       DateTime  @default(now())',
    '  updatedAt       DateTime  @updatedAt',
    '',
    '  booking         Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)',
    '  rideGroup       RideGroup? @relation(fields: [rideGroupId], references: [id], onDelete: Cascade)',
    '  ',
    '  @@index([bookingId])',
    '  @@index([rideGroupId])',
    '  @@map("price_breakdowns")',
    '}',
    '',
    'model Airport {',
    '  id              String    @id @default(cuid())',
    '  code            String    @unique',
    '  name            String',
    '  city            String',
    '  country         String',
    '  latitude        Float',
    '  longitude       Float',
    '  timezone        String',
    '  isActive        Boolean   @default(true)',
    '  ',
    '  createdAt       DateTime  @default(now())',
    '  updatedAt       DateTime  @updatedAt',
    '',
    '  @@index([code])',
    '  @@index([city])',
    '  @@map("airports")',
    '}',
    '',
    'model SystemConfig {',
    '  id              String    @id @default(cuid())',
    '  key             String    @unique',
    '  value           String',
    '  description     String?',
    '  ',
    '  createdAt       DateTime  @default(now())',
    '  updatedAt       DateTime  @updatedAt',
    '',
    '  @@map("system_config")',
    '}',
  ];

  const schemaContent = schemaLines.join('\n');
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  fs.writeFileSync(schemaPath, schemaContent);
  log('✅ Nuovo schema.prisma creato con directUrl per Supabase', 'green');
}

function createSeedFile() {
  log('');
  log('🌱 FASE 3: Creazione file seed', 'bright');
  
  const seedPath = path.join(process.cwd(), 'prisma', 'seed.ts');
  const seedUrl = 'https://gist.githubusercontent.com/anonymous/seed-flanvo/raw/seed.ts';
  
  // Creo il seed file manualmente
  const seedContent = `import { PrismaClient, Direction, VehicleType, GroupStatus, MemberStatus, RoutePointType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  await prisma.priceBreakdown.deleteMany();
  await prisma.groupRoute.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.rideGroup.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.airport.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleared');

  await prisma.airport.createMany({
    data: [
      { code: 'FCO', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'Italy', latitude: 41.8003, longitude: 12.2389, timezone: 'Europe/Rome' },
      { code: 'CIA', name: 'Ciampino–G. B. Pastine International Airport', city: 'Rome', country: 'Italy', latitude: 41.7994, longitude: 12.5949, timezone: 'Europe/Rome' },
    ],
  });

  const p1 = await prisma.user.create({ data: { email: 'mario.rossi@email.com', name: 'Mario Rossi', phone: '+39 320 1234567', role: 'PASSENGER', isVerified: true } });
  const p2 = await prisma.user.create({ data: { email: 'giulia.bianchi@email.com', name: 'Giulia Bianchi', phone: '+39 331 2345678', role: 'PASSENGER', isVerified: true } });
  const p3 = await prisma.user.create({ data: { email: 'luca.verdi@email.com', name: 'Luca Verdi', phone: '+39 340 3456789', role: 'PASSENGER', isVerified: true } });
  const p4 = await prisma.user.create({ data: { email: 'anna.neri@email.com', name: 'Anna Neri', phone: '+39 345 4567890', role: 'PASSENGER', isVerified: true } });

  const d1User = await prisma.user.create({ data: { email: 'giuseppe.autista@email.com', name: 'Giuseppe Ferrari', phone: '+39 350 1111111', role: 'DRIVER', isVerified: true } });
  const d1 = await prisma.driver.create({ data: { userId: d1User.id, licenseNumber: 'AB123456CD', vehicleType: 'VAN', vehiclePlate: 'AB123CD', vehicleModel: 'Mercedes-Benz Vito', vehicleYear: 2022, vehicleColor: 'Black', rating: 4.9, totalRides: 245, isVerified: true } });

  const d2User = await prisma.user.create({ data: { email: 'marco.driver@email.com', name: 'Marco Colombo', phone: '+39 351 2222222', role: 'DRIVER', isVerified: true } });
  const d2 = await prisma.driver.create({ data: { userId: d2User.id, licenseNumber: 'CD789012EF', vehicleType: 'SEDAN', vehiclePlate: 'CD789EF', vehicleModel: 'BMW Serie 5', vehicleYear: 2021, vehicleColor: 'Silver', rating: 4.8, totalRides: 187, isVerified: true } });

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(14, 0, 0, 0);
  const b1 = await prisma.booking.create({ data: { userId: p1.id, pickupLocation: 'Via del Corso, 45, Roma', pickupLat: 41.9028, pickupLng: 12.4964, dropoffLocation: 'Fiumicino Airport', dropoffLat: 41.8003, dropoffLng: 12.2389, pickupTime: tomorrow, flightNumber: 'AZ123', direction: 'TO_AIRPORT', passengers: 2, luggage: 2, estimatedPrice: 55.0, distance: 32.5, status: 'CONFIRMED' } });
  await prisma.ride.create({ data: { bookingId: b1.id, driverId: d2.id, vehicleType: 'SEDAN', scheduledTime: tomorrow, totalPrice: 55.0, totalDistance: 32.5 } });
  await prisma.priceBreakdown.create({ data: { bookingId: b1.id, basePrice: 35.0, distanceFee: 15.0, airportFee: 5.0, finalPrice: 55.0 } });

  const day2 = new Date(); day2.setDate(day2.getDate() + 2); day2.setHours(6, 30, 0, 0);
  const gb1 = await prisma.booking.create({ data: { userId: p2.id, pickupLocation: 'Fiumicino Airport', pickupLat: 41.8003, pickupLng: 12.2389, dropoffLocation: 'Via Veneto, 15', dropoffLat: 41.9078, dropoffLng: 12.4897, pickupTime: day2, flightNumber: 'AZ456', direction: 'FROM_AIRPORT', passengers: 1, luggage: 1, estimatedPrice: 25.0, distance: 30.0, status: 'CONFIRMED', isGroupRide: true } });
  const gb2 = await prisma.booking.create({ data: { userId: p3.id, pickupLocation: 'Fiumicino Airport', pickupLat: 41.8003, pickupLng: 12.2389, dropoffLocation: 'Piazza Navona, 10', dropoffLat: 41.8992, dropoffLng: 12.4731, pickupTime: day2, flightNumber: 'FR789', direction: 'FROM_AIRPORT', passengers: 2, luggage: 2, estimatedPrice: 22.0, distance: 28.0, status: 'CONFIRMED', isGroupRide: true } });
  const gb3 = await prisma.booking.create({ data: { userId: p4.id, pickupLocation: 'Fiumicino Airport', pickupLat: 41.8003, pickupLng: 12.2389, dropoffLocation: 'Via Cola di Rienzo, 88', dropoffLat: 41.9067, dropoffLng: 12.4655, pickupTime: day2, flightNumber: 'LH234', direction: 'FROM_AIRPORT', passengers: 1, luggage: 1, estimatedPrice: 20.0, distance: 26.0, status: 'CONFIRMED', isGroupRide: true } });

  const rg = await prisma.rideGroup.create({ data: { direction: 'FROM_AIRPORT', status: 'READY', maxCapacity: 7, currentCapacity: 4, currentLuggage: 4, targetPickupTime: day2, basePrice: 80.0, totalPrice: 67.0, totalDistance: 38.5, estimatedDuration: 65 } });
  
  await prisma.groupMember.createMany({ data: [
    { bookingId: gb1.id, rideGroupId: rg.id, status: 'CONFIRMED', memberOrder: 1, distanceInRoute: 30.0 },
    { bookingId: gb2.id, rideGroupId: rg.id, status: 'CONFIRMED', memberOrder: 2, distanceInRoute: 28.0 },
    { bookingId: gb3.id, rideGroupId: rg.id, status: 'CONFIRMED', memberOrder: 3, distanceInRoute: 26.0 },
  ]});

  await prisma.groupRoute.createMany({ data: [
    { rideGroupId: rg.id, sequence: 0, type: 'AIRPORT', address: 'Fiumicino Airport', latitude: 41.8003, longitude: 12.2389, estimatedTime: day2, distanceFromPrevious: 0 },
    { rideGroupId: rg.id, sequence: 1, type: 'DROPOFF', address: 'Via Cola di Rienzo, 88', latitude: 41.9067, longitude: 12.4655, estimatedTime: day2, distanceFromPrevious: 26.0, bookingId: gb3.id },
    { rideGroupId: rg.id, sequence: 2, type: 'DROPOFF', address: 'Piazza Navona, 10', latitude: 41.8992, longitude: 12.4731, estimatedTime: day2, distanceFromPrevious: 5.5, bookingId: gb2.id },
    { rideGroupId: rg.id, sequence: 3, type: 'DROPOFF', address: 'Via Veneto, 15', latitude: 41.9078, longitude: 12.4897, estimatedTime: day2, distanceFromPrevious: 7.0, bookingId: gb1.id },
  ]});

  await prisma.ride.create({ data: { rideGroupId: rg.id, driverId: d1.id, vehicleType: 'VAN', scheduledTime: day2, totalPrice: 67.0, totalDistance: 38.5 } });

  await prisma.priceBreakdown.createMany({ data: [
    { bookingId: gb1.id, rideGroupId: rg.id, basePrice: 15.0, distanceFee: 12.0, airportFee: 3.0, sharePercentage: 35.8, savings: 15.0, finalPrice: 24.0 },
    { bookingId: gb2.id, rideGroupId: rg.id, basePrice: 15.0, distanceFee: 10.0, airportFee: 3.0, sharePercentage: 33.6, savings: 17.0, finalPrice: 22.5 },
    { bookingId: gb3.id, rideGroupId: rg.id, basePrice: 15.0, distanceFee: 8.0, airportFee: 3.0, sharePercentage: 30.6, savings: 19.0, finalPrice: 20.5 },
  ]});

  await prisma.systemConfig.createMany({ data: [
    { key: 'GROUP_MIN_PASSENGERS', value: '2', description: 'Min passengers for group' },
    { key: 'GROUP_MAX_PASSENGERS', value: '7', description: 'Max passengers for group' },
    { key: 'BASE_PRICE_PER_KM', value: '1.5' },
    { key: 'AIRPORT_FEE', value: '5.0' },
  ]});

  console.log('🎉 Seed completed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());`;

  fs.writeFileSync(seedPath, seedContent);
  log('✅ File seed.ts creato', 'green');
}

function updatePackageJson() {
  log('');
  log('📦 FASE 4: Aggiornamento package.json', 'bright');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    log('⚠️  package.json non trovato', 'yellow');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (!packageJson.scripts) packageJson.scripts = {};
  packageJson.scripts['db:seed'] = 'prisma db seed';
  
  if (!packageJson.prisma) packageJson.prisma = {};
  packageJson.prisma.seed = 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts';
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  log('✅ package.json aggiornato', 'green');
}

function installDependencies() {
  log('');
  log('📥 FASE 5: Installazione dipendenze', 'bright');
  
  try {
    execSync('npm list ts-node', { encoding: 'utf8', stdio: 'pipe' });
    log('✅ ts-node già installato', 'green');
  } catch {
    execCommand('npm install -D ts-node @types/node typescript', 'Installazione ts-node');
  }
}

function runMigration() {
  log('');
  log('🚀 FASE 6: Esecuzione migration', 'bright');
  
  const success = execCommand('npx prisma migrate dev --name add_shared_rides_support', 'Migration database');
  
  if (!success) {
    log('');
    log('⚠️  ATTENZIONE: La migration ha avuto problemi', 'yellow');
    process.exit(1);
  }
}

function generateClient() {
  log('');
  log('⚙️  FASE 7: Generazione Prisma Client', 'bright');
  execCommand('npx prisma generate', 'Generazione Prisma Client');
}

function runSeed() {
  log('');
  log('🌱 FASE 8: Popolamento database', 'bright');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question('ATTENZIONE: Il seed cancellerà tutti i dati. Continuare? (s/n): ', (answer) => {
      readline.close();
      
      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
        execCommand('npm run db:seed', 'Seed database');
      } else {
        log('⏭️  Seed saltato', 'yellow');
      }
      resolve();
    });
  });
}

async function main() {
  log('');
  log('============================================================', 'bright');
  log('🚀  FLANVO SCHEMA INSTALLER', 'bright');
  log('============================================================', 'bright');
  log('');
  log('📍 Cartella: ' + process.cwd(), 'blue');
  
  const prismaDir = path.join(process.cwd(), 'prisma');
  if (!fs.existsSync(prismaDir)) {
    log('');
    log('❌ ERRORE: Cartella prisma/ non trovata!', 'red');
    process.exit(1);
  }
  
  try {
    createBackup();
    createNewSchema();
    createSeedFile();
    updatePackageJson();
    installDependencies();
    runMigration();
    generateClient();
    await runSeed();
    
    log('');
    log('============================================================', 'green');
    log('🎉  INSTALLAZIONE COMPLETATA!', 'green');
    log('============================================================', 'green');
    log('');
    log('📊 Prossimi passi:', 'bright');
    log('1. Verifica: npx prisma studio', 'blue');
    log('2. Testa: npm run dev', 'blue');
    
  } catch (error) {
    log('');
    log('❌ ERRORE: ' + error.message, 'red');
    process.exit(1);
  }
}

main();