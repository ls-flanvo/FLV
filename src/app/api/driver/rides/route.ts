import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDriver, authErrorResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const payload = await requireDriver(request);

    const driver = await prisma.driver.findUnique({
      where: { userId: payload.userId },
      include: { user: { select: { name: true } } },
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

    // Corse disponibili: solo READY (tutti i passeggeri hanno pagato), senza driver
    const availableGroups = await prisma.rideGroup.findMany({
      where: {
        status: 'READY',
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
        groupMemberId: m.id, // ← ID reale del GroupMember per no-show
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
          airline: group.flightNumber.slice(0, 2),
          departureAirport: group.direction === 'FROM_AIRPORT' ? group.flightNumber.slice(0, 3) : 'CTA',
          arrivalAirport: group.direction === 'FROM_AIRPORT' ? 'CTA' : group.flightNumber.slice(0, 3),
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
      // Transazione atomica — evita race condition tra driver
      try {
        await prisma.$transaction(async (tx) => {
          const fresh = await tx.rideGroup.findUnique({
            where: { id: rideId },
            select: { status: true },
          });
          if (!fresh || fresh.status !== 'READY') {
            throw new Error('ALREADY_TAKEN');
          }
          await tx.rideGroup.update({ where: { id: rideId }, data: { status: 'ASSIGNED' } });

          const existingRide = await tx.ride.findUnique({ where: { groupId: rideId } });
          if (existingRide) {
            await tx.ride.update({
              where: { id: existingRide.id },
              data: { driverId: driver.id, status: 'DRIVER_ASSIGNED' },
            });
          } else {
            await tx.ride.create({
              data: {
                groupId: rideId, driverId: driver.id, vehicleType: driver.vehicleType,
                status: 'DRIVER_ASSIGNED', scheduledTime: group.targetPickupTime,
                totalDriverPay: 0, totalRevenue: 0, totalDistance: 0,
              },
            });
          }
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (msg === 'ALREADY_TAKEN') {
          return NextResponse.json({ error: 'Corsa già presa da un altro driver' }, { status: 409 });
        }
        throw e;
      }

      // Notifica passeggeri che il driver è stato assegnato
      const { createNotification } = await import('@/lib/notify');
      const groupWithMembers = await prisma.rideGroup.findUnique({
        where: { id: rideId },
        include: { members: { where: { status: { not: 'CANCELLED' } }, include: { booking: true } } },
      });
      if (groupWithMembers) {
        for (const member of groupWithMembers.members) {
          createNotification({
            userId: member.booking.userId,
            type: 'RIDE_STARTED',
            title: '🚐 Driver assegnato!',
            body: `Il tuo driver (${driver.vehicleModel}, targa ${driver.vehiclePlate}) è stato assegnato alla tua corsa.`,
            data: { rideGroupId: rideId },
          }).catch(() => {});
        }
      }
    } else if (status === 'at_pickup') {
      // Driver arrivato al punto di incontro → notifica passeggeri
      const groupWithMembers = await prisma.rideGroup.findUnique({
        where: { id: rideId },
        include: {
          members: {
            where: { status: { not: 'CANCELLED' } },
            include: { booking: { include: { user: true } } },
          },
          ride: { include: { driver: { include: { user: true } } } },
        },
      });
      if (groupWithMembers) {
        const driverName = groupWithMembers.ride?.driver?.user?.name ?? 'Il tuo driver';
        const mp = groupWithMembers.meetingPoint ?? 'Terminal Arrivi';
        for (const member of groupWithMembers.members) {
          const { createNotification } = await import('@/lib/notify');
          createNotification({
            userId: member.booking.userId,
            type: 'RIDE_STARTED',
            title: `🚐 ${driverName} è arrivato!`,
            body: `Il tuo driver ti aspetta al punto di incontro: ${mp}`,
            data: { rideGroupId: rideId, meetingPoint: mp },
          }).catch(() => {});
        }
      }
    } else if (status === 'started') {
      // Driver avvia la corsa → IN_PROGRESS
      const existingRide = await prisma.ride.findUnique({ where: { groupId: rideId } });
      if (!existingRide || existingRide.driverId !== driver.id) {
        return NextResponse.json({ error: 'Corsa non trovata o non assegnata a te' }, { status: 403 });
      }
      await prisma.ride.update({
        where: { id: existingRide.id },
        data: { status: 'IN_PROGRESS', startTime: new Date() },
      });
      await prisma.rideGroup.update({
        where: { id: rideId },
        data: { status: 'ACTIVE' },
      });
      // Aggiorna tutti i booking del gruppo a IN_PROGRESS
      await prisma.booking.updateMany({
        where: { groupMember: { rideGroupId: rideId } },
        data: { status: 'IN_PROGRESS' },
      });
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
      message: status === 'accepted' ? 'Corsa accettata' : status === 'started' ? 'Corsa avviata' : status === 'at_pickup' ? 'Passeggeri notificati' : 'Corsa rifiutata',
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
