import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting DBSCAN seed...');

  // Clear database
  await prisma.priceAuditLog.deleteMany();
  await prisma.supplyCheck.deleteMany();
  await prisma.groupRoute.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.rideGroup.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.microGroup.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.airport.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleared');

  // ============================================
  // AIRPORTS
  // ============================================
  await prisma.airport.createMany({
    data: [
      {
        code: 'FCO',
        name: 'Leonardo da Vinci–Fiumicino Airport',
        city: 'Rome',
        country: 'Italy',
        latitude: 41.8003,
        longitude: 12.2389,
        timezone: 'Europe/Rome',
      },
      {
        code: 'CIA',
        name: 'Ciampino–G. B. Pastine International Airport',
        city: 'Rome',
        country: 'Italy',
        latitude: 41.7994,
        longitude: 12.5949,
        timezone: 'Europe/Rome',
      },
    ],
  });
  console.log('✅ Created 2 airports');

  // ============================================
  // USERS (Passengers)
  // ============================================
  const p1 = await prisma.user.create({
    data: {
      email: 'mario.rossi@email.com',
      name: 'Mario Rossi',
      phone: '+39 320 1234567',
      role: 'PASSENGER',
      isVerified: true,
    },
  });

  const p2 = await prisma.user.create({
    data: {
      email: 'giulia.bianchi@email.com',
      name: 'Giulia Bianchi',
      phone: '+39 331 2345678',
      role: 'PASSENGER',
      isVerified: true,
    },
  });

  const p3 = await prisma.user.create({
    data: {
      email: 'luca.verdi@email.com',
      name: 'Luca Verdi',
      phone: '+39 340 3456789',
      role: 'PASSENGER',
      isVerified: true,
    },
  });

  const p4 = await prisma.user.create({
    data: {
      email: 'anna.neri@email.com',
      name: 'Anna Neri',
      phone: '+39 345 4567890',
      role: 'PASSENGER',
      isVerified: true,
    },
  });

  const p5 = await prisma.user.create({
    data: {
      email: 'paolo.russo@email.com',
      name: 'Paolo Russo',
      phone: '+39 348 5678901',
      role: 'PASSENGER',
      isVerified: true,
    },
  });

  console.log('✅ Created 5 passengers');

  // ============================================
  // DRIVERS
  // ============================================
  const d1User = await prisma.user.create({
    data: {
      email: 'giuseppe.autista@email.com',
      name: 'Giuseppe Ferrari',
      phone: '+39 350 1111111',
      role: 'DRIVER',
      isVerified: true,
    },
  });

  const d1 = await prisma.driver.create({
    data: {
      userId: d1User.id,
      licenseNumber: 'AB123456CD',
      vehicleType: 'VAN',
      vehiclePlate: 'AB123CD',
      vehicleModel: 'Mercedes-Benz Vito',
      vehicleYear: 2022,
      vehicleColor: 'Black',
      rating: 4.9,
      totalRides: 245,
      isVerified: true,
      totalEarnings: 12350.50,
    },
  });

  const d2User = await prisma.user.create({
    data: {
      email: 'marco.driver@email.com',
      name: 'Marco Colombo',
      phone: '+39 351 2222222',
      role: 'DRIVER',
      isVerified: true,
    },
  });

  const d2 = await prisma.driver.create({
    data: {
      userId: d2User.id,
      licenseNumber: 'CD789012EF',
      vehicleType: 'SEDAN',
      vehiclePlate: 'CD789EF',
      vehicleModel: 'BMW Serie 5',
      vehicleYear: 2021,
      vehicleColor: 'Silver',
      rating: 4.8,
      totalRides: 187,
      isVerified: true,
      totalEarnings: 8920.00,
    },
  });

  console.log('✅ Created 2 drivers');

  // ============================================
  // SCENARIO 1: MICRO GROUP (2 persone insieme)
  // ============================================
  const microGroup1 = await prisma.microGroup.create({
    data: {
      leadUserId: p4.id,
      totalPassengers: 2,
      totalLuggage: 2,
      mustStayTogether: true,
    },
  });

  console.log('✅ Created micro group (2 people together)');

  // ============================================
  // SCENARIO 2: DBSCAN CLUSTER (Shared Ride)
  // ============================================
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  // Booking 1 - Giulia (solo)
  const b1 = await prisma.booking.create({
    data: {
      userId: p2.id,
      pickupLocation: 'Fiumicino Airport, Terminal 3',
      pickupLat: 41.8003,
      pickupLng: 12.2389,
      dropoffLocation: 'Via Veneto, 15, Roma, RM',
      dropoffLat: 41.9078,
      dropoffLng: 12.4897,
      pickupTime: tomorrow,
      flightNumber: 'AZ456',
      flightDate: new Date('2025-10-20'),  // ✅ AGGIUNGI QUESTA RIGA
      flightTime: tomorrow,
      direction: 'FROM_AIRPORT',
      passengers: 1,
      luggage: 1,
      estimatedPrice: 45.0,
      distanceDirect: 30.0,
      status: 'CONFIRMED',
      isGroupRide: true,
      maxDetourMinutes: 10,
      maxDetourPercent: 20.0,
    },
  });

  // Booking 2 - Luca (solo)
  const b2 = await prisma.booking.create({
    data: {
      userId: p3.id,
      pickupLocation: 'Fiumicino Airport, Terminal 3',
      pickupLat: 41.8003,
      pickupLng: 12.2389,
      dropoffLocation: 'Piazza Navona, 10, Roma, RM',
      dropoffLat: 41.8992,
      dropoffLng: 12.4731,
      pickupTime: tomorrow,
      flightNumber: 'AZ456',
      flightDate: new Date('2025-10-20'),  // ✅ AGGIUNGI QUESTA RIGA
      flightTime: tomorrow,
      direction: 'FROM_AIRPORT',
      passengers: 1,
      luggage: 1,
      estimatedPrice: 42.0,
      distanceDirect: 28.0,
      status: 'CONFIRMED',
      isGroupRide: true,
      maxDetourMinutes: 10,
      maxDetourPercent: 20.0,
    },
  });

  // Booking 3 - Anna (parte micro-gruppo)
  const b3 = await prisma.booking.create({
    data: {
      userId: p4.id,
      pickupLocation: 'Fiumicino Airport, Terminal 3',
      pickupLat: 41.8003,
      pickupLng: 12.2389,
      dropoffLocation: 'Via Cola di Rienzo, 88, Roma, RM',
      dropoffLat: 41.9067,
      dropoffLng: 12.4655,
      pickupTime: tomorrow,
      flightNumber: 'AZ456',
      flightDate: new Date('2025-10-20'),  // ✅ AGGIUNGI QUESTA RIGA
      flightTime: tomorrow,
      direction: 'FROM_AIRPORT',
      passengers: 1,
      luggage: 1,
      estimatedPrice: 39.0,
      distanceDirect: 26.0,
      status: 'CONFIRMED',
      isGroupRide: true,
      microGroupId: microGroup1.id,
      maxDetourMinutes: 10,
      maxDetourPercent: 20.0,
    },
  });

  // Booking 4 - Paolo (parte micro-gruppo)
  const b4 = await prisma.booking.create({
    data: {
      userId: p5.id,
      pickupLocation: 'Fiumicino Airport, Terminal 3',
      pickupLat: 41.8003,
      pickupLng: 12.2389,
      dropoffLocation: 'Via Cola di Rienzo, 90, Roma, RM',
      dropoffLat: 41.9068,
      dropoffLng: 12.4656,
      pickupTime: tomorrow,
      flightNumber: 'AZ456',
      flightDate: new Date('2025-10-20'),  // ✅ AGGIUNGI QUESTA RIGA
      flightTime: tomorrow,
      direction: 'FROM_AIRPORT',
      passengers: 1,
      luggage: 1,
      estimatedPrice: 39.0,
      distanceDirect: 26.0,
      status: 'CONFIRMED',
      isGroupRide: true,
      microGroupId: microGroup1.id,
      maxDetourMinutes: 10,
      maxDetourPercent: 20.0,
    },
  });

  console.log('✅ Created 4 bookings (same flight AZ456)');

  // RideGroup - DBSCAN Cluster
  const rg = await prisma.rideGroup.create({
    data: {
      flightNumber: 'AZ456',
      direction: 'FROM_AIRPORT',
      status: 'CONFIRMED',
      maxCapacity: 7,
      currentCapacity: 4,
      currentLuggage: 4,
      targetPickupTime: tomorrow,
      clusterMethod: 'DBSCAN',
      eps: 8.5,
      minSamples: 2,
      totalRouteKm: 36.5,
      totalDuration: 55,
      detourPercentage: 12.5,
      extraTimeMinutes: 8,
      qualityScore: 85.0,
      stabilityTier: 'GOOD',
      basePrice: 150.0,
      totalPrice: 138.0,
      bookingCloseTime: new Date(tomorrow.getTime() - 60 * 60 * 1000), // T-60
      matchConfirmTime: new Date(tomorrow.getTime() - 40 * 60 * 1000), // T-40
      passengerNotifyTime: new Date(tomorrow.getTime() - 30 * 60 * 1000), // T-30
      matrixCacheId: 'mapbox_matrix_az456_' + Date.now(),
      routeVersion: 1,
    },
  });

  console.log('✅ Created RideGroup (DBSCAN cluster)');

  // GroupMembers
  await prisma.groupMember.createMany({
    data: [
      {
        bookingId: b3.id,
        rideGroupId: rg.id,
        status: 'CONFIRMED',
        pickupOrder: 1,
        dropoffOrder: 1,
        kmOnboard: 26.0,
        kmDirect: 26.0,
        detourKm: 0.0,
        detourPercent: 0.0,
        extraMinutes: 0,
        baseFare: 7.80, // 26km * 0.30€
        driverShare: 52.0, // 26km * 2.00€
        flanvoFeeRate: 15.0,
        flanvoFee: 1.17,
        totalPrice: 33.0,
        microGroupId: microGroup1.id,
        paymentStatus: 'AUTHORIZED',
      },
      {
        bookingId: b4.id,
        rideGroupId: rg.id,
        status: 'CONFIRMED',
        pickupOrder: 2,
        dropoffOrder: 2,
        kmOnboard: 26.1,
        kmDirect: 26.0,
        detourKm: 0.1,
        detourPercent: 0.4,
        extraMinutes: 0,
        baseFare: 7.83,
        driverShare: 52.2,
        flanvoFeeRate: 15.0,
        flanvoFee: 1.17,
        totalPrice: 33.0,
        microGroupId: microGroup1.id,
        paymentStatus: 'AUTHORIZED',
      },
      {
        bookingId: b2.id,
        rideGroupId: rg.id,
        status: 'CONFIRMED',
        pickupOrder: 3,
        dropoffOrder: 3,
        kmOnboard: 30.5,
        kmDirect: 28.0,
        detourKm: 2.5,
        detourPercent: 8.9,
        extraMinutes: 4,
        baseFare: 9.15,
        driverShare: 61.0,
        flanvoFeeRate: 15.0,
        flanvoFee: 1.37,
        totalPrice: 38.0,
        paymentStatus: 'AUTHORIZED',
      },
      {
        bookingId: b1.id,
        rideGroupId: rg.id,
        status: 'CONFIRMED',
        pickupOrder: 4,
        dropoffOrder: 4,
        kmOnboard: 34.0,
        kmDirect: 30.0,
        detourKm: 4.0,
        detourPercent: 13.3,
        extraMinutes: 7,
        baseFare: 10.20,
        driverShare: 68.0,
        flanvoFeeRate: 15.0,
        flanvoFee: 1.53,
        totalPrice: 42.0,
        paymentStatus: 'AUTHORIZED',
      },
    ],
  });

  console.log('✅ Created 4 GroupMembers (with pricing breakdown)');

  // GroupRoutes (optimized)
  await prisma.groupRoute.createMany({
    data: [
      {
        rideGroupId: rg.id,
        sequence: 0,
        type: 'AIRPORT',
        address: 'Fiumicino Airport, Terminal 3',
        latitude: 41.8003,
        longitude: 12.2389,
        estimatedArrival: tomorrow,
        distanceFromPrev: 0,
        durationFromPrev: 0,
      },
      {
        rideGroupId: rg.id,
        sequence: 1,
        type: 'DROPOFF',
        address: 'Via Cola di Rienzo, 88, Roma, RM',
        latitude: 41.9067,
        longitude: 12.4655,
        estimatedArrival: new Date(tomorrow.getTime() + 22 * 60 * 1000),
        distanceFromPrev: 26.0,
        durationFromPrev: 22,
        bookingId: b3.id,
      },
      {
        rideGroupId: rg.id,
        sequence: 2,
        type: 'DROPOFF',
        address: 'Via Cola di Rienzo, 90, Roma, RM',
        latitude: 41.9068,
        longitude: 12.4656,
        estimatedArrival: new Date(tomorrow.getTime() + 24 * 60 * 1000),
        distanceFromPrev: 0.1,
        durationFromPrev: 2,
        bookingId: b4.id,
      },
      {
        rideGroupId: rg.id,
        sequence: 3,
        type: 'DROPOFF',
        address: 'Piazza Navona, 10, Roma, RM',
        latitude: 41.8992,
        longitude: 12.4731,
        estimatedArrival: new Date(tomorrow.getTime() + 42 * 60 * 1000),
        distanceFromPrev: 4.3,
        durationFromPrev: 18,
        bookingId: b2.id,
      },
      {
        rideGroupId: rg.id,
        sequence: 4,
        type: 'DROPOFF',
        address: 'Via Veneto, 15, Roma, RM',
        latitude: 41.9078,
        longitude: 12.4897,
        estimatedArrival: new Date(tomorrow.getTime() + 55 * 60 * 1000),
        distanceFromPrev: 6.1,
        durationFromPrev: 13,
        bookingId: b1.id,
      },
    ],
  });

  console.log('✅ Created 5 GroupRoutes (optimized route)');

  // Ride
  const ride = await prisma.ride.create({
    data: {
      groupId: rg.id,
      driverId: d1.id,
      vehicleType: 'VAN',
      status: 'SCHEDULED',
      scheduledTime: tomorrow,
      totalDriverPay: 233.2, // 2.00€/km * 116.6km total
      totalRevenue: 146.0, // Total passenger payments
      totalDistance: 36.5,
      confirmedAt: new Date(tomorrow.getTime() - 40 * 60 * 1000),
      passengerNotified: new Date(tomorrow.getTime() - 30 * 60 * 1000),
      pickupWindowStart: new Date(tomorrow.getTime() - 10 * 60 * 1000),
      pickupWindowEnd: new Date(tomorrow.getTime() + 10 * 60 * 1000),
    },
  });

  console.log('✅ Created Ride with driver assignment');

  // SupplyCheck
  await prisma.supplyCheck.create({
    data: {
      rideGroupId: rg.id,
      checkTime: new Date(tomorrow.getTime() - 40 * 60 * 1000), // T-40
      requiredVehicles: 1,
      requiredCapacity: 4,
      availableVehicles: 3,
      availableDrivers: 5,
      backupDrivers: 2,
      checkPassed: true,
      driverAssigned: true,
      notificationSent: true,
    },
  });

  console.log('✅ Created SupplyCheck (T-40)');

  // PriceAuditLog
  await prisma.priceAuditLog.create({
    data: {
      rideGroupId: rg.id,
      routeVersion: 1,
      matrixCacheId: 'mapbox_matrix_az456_' + Date.now(),
      totalRouteKm: 36.5,
      directKm: 28.0,
      detourKm: 8.5,
      detourPercent: 30.4,
      baseFarePerKm: 0.30,
      totalBaseFare: 35.0,
      driverRatePerKm: 2.00,
      totalDriverPay: 233.2,
      flanvoFeeRate: 15.0,
      flanvoFee: 5.25,
      finalPrice: 146.0,
      matchScore: 85.0,
      qualityTier: 'GOOD',
      maxDetourPercent: 20.0,
      maxDetourMinutes: 10,
      constraintsMet: true,
      calculatedBy: 'system',
      notes: 'DBSCAN clustering with 4 passengers, 1 micro-group',
    },
  });

  console.log('✅ Created PriceAuditLog');

  // ============================================
  // SYSTEM CONFIG
  // ============================================
  await prisma.systemConfig.createMany({
    data: [
      { key: 'DBSCAN_EPS', value: '8.5', description: 'DBSCAN epsilon (km)' },
      { key: 'DBSCAN_MIN_SAMPLES', value: '2', description: 'DBSCAN min samples' },
      { key: 'GROUP_MIN_PAX', value: '2', description: 'Min passengers for group' },
      { key: 'GROUP_MAX_PAX', value: '7', description: 'Max passengers for group' },
      { key: 'PRICE_TIER_1', value: '0.30', description: 'Price 0-50km (€/km)' },
      { key: 'PRICE_TIER_2', value: '0.25', description: 'Price 51-99km (€/km)' },
      { key: 'PRICE_TIER_3', value: '0.20', description: 'Price ≥100km (€/km)' },
      { key: 'DRIVER_RATE', value: '2.00', description: 'Driver rate (€/km)' },
      { key: 'FLANVO_FEE_RATE', value: '15.0', description: 'Flanvo fee (%)' },
      { key: 'MAX_DETOUR_PERCENT', value: '20.0', description: 'Max detour (%)' },
      { key: 'MAX_DETOUR_MINUTES', value: '10', description: 'Max extra time (min)' },
      { key: 'TIMELINE_CLOSE', value: '60', description: 'T-60: Booking close (min)' },
      { key: 'TIMELINE_MATCH', value: '40', description: 'T-40: Match & supply (min)' },
      { key: 'TIMELINE_NOTIFY', value: '30', description: 'T-30: Notify passengers (min)' },
    ],
  });

  console.log('✅ Created system configuration');

  console.log('\n🎉 DBSCAN Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   - 2 Airports (FCO, CIA)');
  console.log('   - 5 Passengers');
  console.log('   - 2 Drivers');
  console.log('   - 1 MicroGroup (2 people together)');
  console.log('   - 1 DBSCAN Cluster (4 passengers, same flight)');
  console.log('   - 1 Shared Ride (VAN)');
  console.log('   - Quality Score: 85.0 (GOOD)');
  console.log('   - Detour: 12.5% avg, 8min extra');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });