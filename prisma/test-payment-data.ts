import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating test data for payment system...');

  // 1. Create Driver with fake Stripe account
  const driver = await prisma.driver.create({
    data: {
      userId: 'cmgtq9eba0007tq0cpwq1i705', // Giuseppe Ferrari
      licenseNumber: 'TEST123456',
      vehicleType: 'VAN',
      vehiclePlate: 'AB123CD',
      vehicleModel: 'Mercedes Vito',
      vehicleYear: 2023,
      vehicleColor: 'White',
      isAvailable: true,
      isVerified: true,
      stripeConnectedAccountId: 'acct_test_driver123', // Fake for testing
      stripeAccountStatus: 'complete',
      stripeOnboardingComplete: true,
      stripePayoutsEnabled: true,
      stripeDetailsSubmitted: true
    }
  });

  console.log('✅ Driver created:', driver.id);

  // 2. Create RideGroup
  const group = await prisma.rideGroup.create({
    data: {
      flightNumber: 'AZ1234',
      direction: 'FROM_AIRPORT',
      targetPickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // +2 hours
      maxCapacity: 7,
      currentCapacity: 1,
      totalRouteKm: 35,
      basePrice: 70,
      status: 'CONFIRMED',
      matchConfirmTime: new Date()
    }
  });

  console.log('✅ RideGroup created:', group.id);

  // 3. Create Booking
  const booking = await prisma.booking.create({
    data: {
      userId: 'cmgtq9da40002tq0c4v09mxqj', // Mario Rossi
      pickupLocation: 'Malpensa Terminal 1',
      pickupLat: 45.6301,
      pickupLng: 8.7237,
      dropoffLocation: 'Milano Centro, Via Dante 15',
      dropoffLat: 45.4642,
      dropoffLng: 9.1900,
      pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      flightNumber: 'AZ1234',
      flightDate: new Date(),
      direction: 'FROM_AIRPORT',
      passengers: 1,
      luggage: 1,
      status: 'MATCHED',
      isGroupRide: true
    }
  });

  console.log('✅ Booking created:', booking.id);

  // 4. Create GroupMember with pricing
  const member = await prisma.groupMember.create({
    data: {
      bookingId: booking.id,
      rideGroupId: group.id,
      status: 'CONFIRMED',
      pickupOrder: 1,
      dropoffOrder: 1,
      kmOnboard: 35,
      kmDirect: 33,
      detourKm: 2,
      detourPercent: 6.06,
      extraMinutes: 3,
      driverShare: 14.00,
      flanvoFeeRate: 0.30,
      flanvoFee: 10.50,
      totalPrice: 25.50,
      paymentStatus: 'PENDING'
    }
  });

  console.log('✅ GroupMember created:', member.id);

  // 5. Create Ride
  await prisma.ride.create({
    data: {
      driverId: driver.id,
      groupId: group.id,
      vehicleType: 'VAN',
      scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      status: 'SCHEDULED',
      totalDriverPay: 70,
      totalRevenue: 25.50,
      totalDistance: 35,
      pickupWindowStart: new Date(Date.now() + 1.5 * 60 * 60 * 1000),
      pickupWindowEnd: new Date(Date.now() + 2.5 * 60 * 60 * 1000)
    }
  });

  console.log('✅ Ride created');
  console.log('\n🎉 Test data ready!');
  console.log(`\n📝 Test with memberId: ${member.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());