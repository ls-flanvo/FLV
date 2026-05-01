import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireDriver, authErrorResponse } from '@/lib/api-auth';
import { sendRideReceipt } from '@/lib/email';
import { createNotification } from '@/lib/notify';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const schema = z.object({ rideGroupId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const payload = await requireDriver(req);
    const { rideGroupId } = schema.parse(await req.json());

    // Carica gruppo con tutti i membri e il ride
    const group = await prisma.rideGroup.findUnique({
      where: { id: rideGroupId },
      include: {
        ride: { include: { driver: { include: { user: true } } } },
        members: {
          where: { status: { not: 'CANCELLED' } },
          include: { booking: { include: { user: true } } },
        },
      },
    });

    if (!group) return NextResponse.json({ error: 'Gruppo non trovato' }, { status: 404 });
    if (!group.ride) return NextResponse.json({ error: 'Nessun ride associato al gruppo' }, { status: 400 });

    const driver = group.ride.driver;
    if (!driver) return NextResponse.json({ error: 'Driver non trovato' }, { status: 400 });
    if (driver.userId !== payload.userId) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    if (!driver.stripeConnectedAccountId) {
      return NextResponse.json({ error: 'Account Stripe driver non collegato' }, { status: 400 });
    }

    let totalCaptured = 0;
    let totalDriverPay = 0;
    const errors: string[] = [];

    for (const member of group.members) {
      // Il pagamento è già catturato al momento dell'accettazione del driver
      if (!member.paymentIntentId || member.paymentStatus !== 'CAPTURED') continue;

      try {
        // Transfer quota driver via Stripe Connect
        const driverShareCents = Math.round((member.driverShare ?? 0) * 100);
        if (driverShareCents > 0) {
          await stripe.transfers.create({
            amount: driverShareCents,
            currency: 'eur',
            destination: driver.stripeConnectedAccountId,
            transfer_group: rideGroupId,
            metadata: { memberId: member.id, type: 'driver_earnings' },
          });
        }

        // Aggiorna member
        await prisma.groupMember.update({
          where: { id: member.id },
          data: { status: 'COMPLETED', actualDropoffTime: new Date() },
        });

        // Aggiorna booking
        await prisma.booking.update({
          where: { id: member.bookingId },
          data: { status: 'COMPLETED' },
        });

        totalCaptured += member.totalPrice ?? 0;
        totalDriverPay += member.driverShare ?? 0;

        // Email ricevuta al passeggero
        const receiptId = `FLV-${rideGroupId.slice(-6).toUpperCase()}-${member.id.slice(-4).toUpperCase()}`;
        sendRideReceipt(member.booking.user.email, {
          userName: member.booking.user.name ?? 'Passeggero',
          flightNumber: group.flightNumber,
          pickupTime: group.targetPickupTime.toISOString(),
          dropoffAddress: member.booking.dropoffLocation,
          driverName: driver.user.name,
          vehicleModel: driver.vehicleModel,
          vehiclePlate: driver.vehiclePlate,
          driverShare: member.driverShare ?? 0,
          flanvoFee: member.flanvoFee ?? 0,
          totalPrice: member.totalPrice ?? 0,
          receiptId,
        }).catch(() => {});

        // Notifica completamento + invito a valutare
        createNotification({
          userId: member.booking.userId,
          type: 'RIDE_COMPLETED',
          title: 'Sei arrivato! ⭐ Valuta la corsa',
          body: `Pagamento di €${(member.totalPrice ?? 0).toFixed(2)} addebitato. Come è andata? Lascia una valutazione dalla dashboard.`,
          data: { bookingId: member.bookingId, rideGroupId, action: 'rate' },
        }).catch(() => {});
      } catch (e) {
        console.error(`Capture failed for member ${member.id}:`, e);
        errors.push(member.id);
      }
    }

    // Aggiorna ride e gruppo a COMPLETED
    await prisma.ride.update({
      where: { id: group.ride.id },
      data: { status: 'COMPLETED', endTime: new Date(), totalDriverPay, totalRevenue: totalCaptured },
    });
    await prisma.rideGroup.update({
      where: { id: rideGroupId },
      data: { status: 'COMPLETED' },
    });

    // Aggiorna stats driver
    await prisma.driver.update({
      where: { id: driver.id },
      data: { totalEarnings: { increment: totalDriverPay }, totalRides: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      totalCaptured: Math.round(totalCaptured * 100) / 100,
      totalDriverPay: Math.round(totalDriverPay * 100) / 100,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Input non valido', details: error.errors }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}
