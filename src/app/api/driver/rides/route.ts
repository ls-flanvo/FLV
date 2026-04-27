import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDriver, authErrorResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const payload = await requireDriver(request);

    const driver = await prisma.driver.findUnique({
      where: { userId: payload.userId },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Profilo autista non trovato' }, { status: 404 });
    }

    // Corse assegnate a questo driver
    const assignedGroups = await prisma.rideGroup.findMany({
      where: {
        ride: { driverId: driver.id },
      },
      include: {
        members: {
          include: {
            booking: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
        ride: true,
      },
    });

    // Corse disponibili (CONFIRMED, nessun driver)
    const availableGroups = await prisma.rideGroup.findMany({
      where: {
        status: 'CONFIRMED',
        ride: { is: null },
      },
      include: {
        members: {
          include: {
            booking: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      take: 10,
    });

    const formatGroup = (group: typeof assignedGroups[0] | typeof availableGroups[0], isAssigned: boolean) => {
      const passengers = group.members.map((m) => ({
        id: m.booking.user.id,
        name: m.booking.user.name,
      }));

      const destinations = group.members.map((m) => ({
        city: m.booking.dropoffLocation.split(',')[0] || m.booking.dropoffLocation,
        address: m.booking.dropoffLocation,
        lat: m.booking.dropoffLat,
        lng: m.booking.dropoffLng,
      }));

      const totalPrice = group.members.reduce((sum, m) => sum + (m.totalPrice ?? 0), 0);
      const rideStatus = isAssigned && 'ride' in group && group.ride
        ? group.ride.status.toLowerCase()
        : 'pending';

      return {
        id: group.id,
        rideGroupId: group.id,
        flight: {
          id: group.flightNumber,
          code: group.flightNumber,
          airline: 'Volo',
          departureAirport: 'FCO',
          arrivalAirport: 'FCO',
          scheduledTime: group.targetPickupTime.toISOString(),
          actualTime: null,
          delayMins: 0,
          status: 'scheduled',
        },
        passengers,
        destinations,
        totalPrice: Math.round(totalPrice * 100) / 100,
        status: rideStatus as 'pending' | 'accepted' | 'completed' | 'rejected',
        pickupTime: group.targetPickupTime.toISOString(),
      };
    };

    const rides = [
      ...assignedGroups.map((g) => formatGroup(g, true)),
      ...availableGroups.map((g) => formatGroup(g, false)),
    ];

    return NextResponse.json({
      rides,
      driverStats: {
        rating: driver.rating,
        totalRides: driver.totalRides,
        totalEarnings: driver.totalEarnings,
        isAvailable: driver.isAvailable,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await requireDriver(request);
    const { rideId, status } = await request.json();

    if (!rideId || !status) {
      return NextResponse.json({ error: 'rideId e status sono obbligatori' }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({ where: { userId: payload.userId } });
    if (!driver) {
      return NextResponse.json({ error: 'Profilo autista non trovato' }, { status: 404 });
    }

    const group = await prisma.rideGroup.findUnique({ where: { id: rideId } });
    if (!group) {
      return NextResponse.json({ error: 'Corsa non trovata' }, { status: 404 });
    }

    if (status === 'accepted') {
      // Crea o aggiorna il Ride con il driver
      await prisma.rideGroup.update({
        where: { id: rideId },
        data: { status: 'ASSIGNED' },
      });

      const existingRide = await prisma.ride.findUnique({ where: { groupId: rideId } });
      if (existingRide) {
        await prisma.ride.update({
          where: { id: existingRide.id },
          data: { driverId: driver.id, status: 'DRIVER_ASSIGNED' },
        });
      } else {
        await prisma.ride.create({
          data: {
            groupId: rideId,
            driverId: driver.id,
            vehicleType: driver.vehicleType,
            status: 'DRIVER_ASSIGNED',
            scheduledTime: group.targetPickupTime,
            totalDriverPay: 0,
            totalRevenue: 0,
            totalDistance: 0,
          },
        });
      }
    } else if (status === 'rejected') {
      await prisma.rideGroup.update({
        where: { id: rideId },
        data: { status: 'CONFIRMED' },
      });

      const existingRide = await prisma.ride.findUnique({ where: { groupId: rideId } });
      if (existingRide?.driverId === driver.id) {
        await prisma.ride.update({
          where: { id: existingRide.id },
          data: { driverId: null, status: 'SCHEDULED' },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: status === 'accepted' ? 'Corsa accettata con successo' : 'Corsa rifiutata',
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
