// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password helper
  const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
  };

  // ============================================
  // USERS
  // ============================================
  
  console.log('Creating users...');
  
  const passenger = await prisma.user.upsert({
    where: { email: 'passenger@test.com' },
    update: {},
    create: {
      email: 'passenger@test.com',
      name: 'Mario Rossi',
      phone: '+39 333 1234567',
      password: await hashPassword('Password123!'),
      role: 'USER',
      verified: true,
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@test.com' },
    update: {},
    create: {
      email: 'driver@test.com',
      name: 'Giuseppe Verdi',
      phone: '+39 334 7654321',
      password: await hashPassword('Password123!'),
      role: 'DRIVER',
      verified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@flanvo.com' },
    update: {},
    create: {
      email: 'admin@flanvo.com',
      name: 'Admin Flanvo',
      phone: '+39 335 9999999',
      password: await hashPassword('Admin123!'),
      role: 'ADMIN',
      verified: true,
    },
  });

  console.log('✅ Users created:', { passenger: passenger.id, driver: driverUser.id, admin: admin.id });

  // ============================================
  // DRIVER
  // ============================================
  
  console.log('Creating driver profile...');
  
  const driver = await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      surname: 'Verdi',
      dateOfBirth: new Date('1985-06-15'),
      taxCode: 'VRDGPP85H15F205Z',
      
      // Address
      address: 'Via Roma, 123',
      city: 'Milano',
      province: 'MI',
      zipCode: '20100',
      
      // Documents
      licenseNumber: 'MI1234567X',
      licenseExpiry: new Date('2027-12-31'),
      cqcNumber: 'CQC9876543',
      cqcExpiry: new Date('2026-06-30'),
      
      // Vehicle
      vehicleBrand: 'Mercedes-Benz',
      vehicleModel: 'Classe E',
      vehicleYear: 2022,
      licensePlate: 'AB123CD',
      vehicleColor: 'Nero',
      seats: 4,
      
      // Insurance
      insuranceCompany: 'Generali',
      insuranceNumber: 'POL123456789',
      insuranceExpiry: new Date('2025-12-31'),
      
      // Status
      status: 'APPROVED',
      approved: true,
      approvedAt: new Date(),
      availability: 'fulltime',
      
      // Stats
      rating: 4.8,
      totalRides: 156,
      completedRides: 152,
    },
  });

  console.log('✅ Driver created:', driver.id);

  // ============================================
  // PENDING DRIVER (for approval testing)
  // ============================================
  
  console.log('Creating pending driver...');
  
  const pendingDriverUser = await prisma.user.create({
    data: {
      email: 'pending.driver@test.com',
      name: 'Laura',
      phone: '+39 337 8889999',
      password: await hashPassword('Password123!'),
      role: 'DRIVER',
      verified: true,
    },
  });

  await prisma.driver.create({
    data: {
      userId: pendingDriverUser.id,
      surname: 'Bianchi',
      dateOfBirth: new Date('1990-03-22'),
      taxCode: 'BNCLRA90C62F205W',
      
      address: 'Corso Italia, 45',
      city: 'Roma',
      province: 'RM',
      zipCode: '00100',
      
      licenseNumber: 'RM7654321Y',
      licenseExpiry: new Date('2028-08-15'),
      cqcNumber: 'CQC5554443',
      cqcExpiry: new Date('2027-03-20'),
      
      vehicleBrand: 'BMW',
      vehicleModel: 'Serie 5',
      vehicleYear: 2023,
      licensePlate: 'EF456GH',
      vehicleColor: 'Bianco',
      seats: 5,
      
      insuranceCompany: 'AXA',
      insuranceNumber: 'POL987654321',
      insuranceExpiry: new Date('2026-01-15'),
      
      status: 'PENDING',
      approved: false,
      availability: 'parttime',
    },
  });

  console.log('✅ Pending driver created');

  // ============================================
  // BOOKINGS
  // ============================================
  
  console.log('Creating bookings...');

  const bookingCode1 = `FLV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  const booking1 = await prisma.booking.create({
    data: {
      bookingCode: bookingCode1,
      userId: passenger.id,
      
      flightNumber: 'AZ1234',
      flightDate: new Date('2024-10-15'),
      flightTime: '14:30',
      flightStatus: 'SCHEDULED',
      
      pickupAddress: 'Aeroporto di Catania-Fontanarossa (CTA)',
      pickupAirport: 'Catania (CTA)',
      pickupLat: 37.4668,
      pickupLng: 15.0664,
      
      dropoffAddress: 'Via Roma 123, 98100 Messina, ME',
      dropoffLat: 38.1938,
      dropoffLng: 15.5540,
      
      pickupTime: new Date('2024-10-15T14:30:00Z'),
      
      passengers: 2,
      luggage: 2,
      
      notes: 'Volo internazionale - necessario cartello con nome',
      
      basePrice: 148.40,
      platformFee: 37.10,
      totalPrice: 185.50,
      
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
    },
  });

  console.log('✅ Booking 1 created:', booking1.bookingCode);

  // ============================================
  // RIDE (Assigned to booking1)
  // ============================================
  
  console.log('Creating ride...');
  
  await prisma.ride.create({
    data: {
      bookingId: booking1.id,
      driverId: driver.id,
      
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      
      driverEarnings: 148.40,
      platformFee: 37.10,
    },
  });

  console.log('✅ Ride created for booking:', booking1.bookingCode);

  // ============================================
  // COMPLETED BOOKING (for history)
  // ============================================
  
  const bookingCode2 = `FLV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  const booking2 = await prisma.booking.create({
    data: {
      bookingCode: bookingCode2,
      userId: passenger.id,
      
      flightNumber: 'FR5678',
      flightDate: new Date('2024-09-20'),
      flightTime: '10:00',
      flightStatus: 'LANDED',
      
      pickupAddress: 'Aeroporto di Palermo (PMO)',
      pickupAirport: 'Palermo (PMO)',
      
      dropoffAddress: 'Centro storico, Taormina',
      
      pickupTime: new Date('2024-09-20T10:00:00Z'),
      
      passengers: 1,
      luggage: 1,
      
      basePrice: 80.00,
      platformFee: 20.00,
      totalPrice: 100.00,
      
      paymentStatus: 'PAID',
      status: 'COMPLETED',
    },
  });

  const completedRide = await prisma.ride.create({
    data: {
      bookingId: booking2.id,
      driverId: driver.id,
      
      status: 'COMPLETED',
      acceptedAt: new Date('2024-09-19T15:00:00Z'),
      startedAt: new Date('2024-09-20T10:00:00Z'),
      completedAt: new Date('2024-09-20T11:30:00Z'),
      
      driverEarnings: 80.00,
      platformFee: 20.00,
      
      rating: 5,
      review: 'Autista professionale e puntuale!',
    },
  });

  console.log('✅ Completed booking created:', booking2.bookingCode);

  // ============================================
  // SYSTEM SETTINGS
  // ============================================
  
  console.log('Creating system settings...');
  
  await prisma.systemSettings.createMany({
    data: [
      {
        key: 'platform_fee_percentage',
        value: '20',
        description: 'Percentage of booking price taken as platform fee',
      },
      {
        key: 'base_price_per_km',
        value: '1.5',
        description: 'Base price per kilometer',
      },
      {
        key: 'cancellation_fee_hours',
        value: '24',
        description: 'Hours before pickup for free cancellation',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ System settings created');

  // ============================================
  // NOTIFICATIONS
  // ============================================
  
  console.log('Creating notifications...');
  
  await prisma.notification.createMany({
    data: [
      {
        userId: passenger.id,
        type: 'booking_confirmed',
        title: 'Prenotazione Confermata',
        message: `La tua prenotazione ${booking1.bookingCode} è stata confermata!`,
        read: false,
        data: { bookingId: booking1.id },
      },
      {
        userId: driverUser.id,
        type: 'ride_assigned',
        title: 'Nuova Corsa Assegnata',
        message: `Ti è stata assegnata una nuova corsa per il ${booking1.flightDate}`,
        read: false,
        data: { rideId: booking1.id },
      },
    ],
  });

  console.log('✅ Notifications created');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📊 Created:');
  console.log('  - 3 Users (passenger, driver, admin)');
  console.log('  - 2 Drivers (1 approved, 1 pending)');
  console.log('  - 2 Bookings (1 active, 1 completed)');
  console.log('  - 2 Rides');
  console.log('  - System settings');
  console.log('  - Notifications\n');
  console.log('🔑 Test Accounts:');
  console.log('  Passenger: passenger@test.com / Password123!');
  console.log('  Driver:    driver@test.com / Password123!');
  console.log('  Admin:     admin@flanvo.com / Admin123!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });