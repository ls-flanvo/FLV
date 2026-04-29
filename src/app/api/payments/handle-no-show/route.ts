import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireDriver, authErrorResponse } from '@/lib/api-auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Validation schema
const noShowSchema = z.object({
  memberId: z.string().cuid(),
  reason: z.string().optional()
});

const WAIT_AFTER_MEETING_MS = 20 * 60 * 1000; // 20 min dal meeting time

export async function POST(req: NextRequest) {
  try {
    await requireDriver(req);
    const body = await req.json();
    const { memberId, reason } = noShowSchema.parse(body);

    // Get GroupMember
    const member = await prisma.groupMember.findUnique({
      where: { id: memberId },
      include: {
        booking: {
          include: {
            user: true
          }
        },
        rideGroup: {
          include: {
            ride: {
              include: {
                driver: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'GroupMember not found' },
        { status: 404 }
      );
    }

    if (!member.paymentIntentId) {
      return NextResponse.json(
        { error: 'No payment intent found' },
        { status: 400 }
      );
    }

    if (member.status === 'NO_SHOW') {
      return NextResponse.json(
        { error: 'Already marked as no-show' },
        { status: 400 }
      );
    }

    // Verifica che siano trascorsi 20 min dal meeting time (landing + 25 min + 20 min attesa)
    const meetingTime = member.rideGroup.meetingTime;
    if (!meetingTime) {
      // Se meetingTime non è settato (volo non ancora atterrato), usa targetPickupTime
      const pickupRef = member.rideGroup.targetPickupTime;
      const elapsed = Date.now() - pickupRef.getTime();
      if (elapsed < WAIT_AFTER_MEETING_MS) {
        const remaining = Math.ceil((WAIT_AFTER_MEETING_MS - elapsed) / 60000);
        return NextResponse.json(
          { error: `Attendi ancora ${remaining} minuti prima di marcare il no-show` },
          { status: 400 }
        );
      }
    } else {
      const elapsed = Date.now() - meetingTime.getTime();
      if (elapsed < WAIT_AFTER_MEETING_MS) {
        const remaining = Math.ceil((WAIT_AFTER_MEETING_MS - elapsed) / 60000);
        return NextResponse.json(
          { error: `Attendi ancora ${remaining} minuti al punto di incontro prima di marcare il no-show` },
          { status: 400 }
        );
      }
    }

    const ride = member.rideGroup.ride;
    if (!ride) {
      return NextResponse.json({ error: 'Corsa non ancora iniziata' }, { status: 400 });
    }

    const driver = ride.driver;
    if (!driver || !driver.stripeConnectedAccountId) {
      return NextResponse.json(
        { error: 'Driver not found or Stripe account not connected' },
        { status: 400 }
      );
    }

    const idempotencyKey = `noshow-${memberId}-${Date.now()}`;

    // STEP 1: Capture ONLY driver share
    const captured = await stripe.paymentIntents.capture(
      member.paymentIntentId,
      {
        amount_to_capture: Math.round(member.driverShare! * 100)
      },
      {
        idempotencyKey
      }
    );

    console.log(`No-show capture: ${captured.id} - €${member.driverShare}`);

    // STEP 2: Refund flanvo fee + protection fee (0 km = no service)
    const refundAmount = (member.flanvoFee || 0) + 1.00; // flanvo fee + protection
    const refund = await stripe.refunds.create({
      payment_intent: member.paymentIntentId,
      amount: Math.round(refundAmount * 100),
      reason: 'requested_by_customer',
      metadata: {
        type: 'NO_SHOW_REFUND',
        memberId: member.id,
        reason: '0 km traveled = no service fee'
      }
    });

    console.log(`No-show refund: ${refund.id} - €${refundAmount}`);

    // STEP 3: Transfer driver share to driver (compensation for waiting)
    const transfer = await stripe.transfers.create({
      amount: Math.round(member.driverShare! * 100),
      currency: 'eur',
      destination: driver.stripeConnectedAccountId,
      metadata: {
        memberId: member.id,
        type: 'no_show_compensation',
        reason: reason || 'Passenger no-show after 20 min wait'
      }
    });

    console.log(`No-show transfer: ${transfer.id} - €${member.driverShare} to driver ${driver.id}`);

    // STEP 4: Update GroupMember
    await prisma.groupMember.update({
      where: { id: memberId },
      data: {
        status: 'NO_SHOW',
        paymentStatus: 'CAPTURED',
        capturedAt: new Date()
      }
    });

    // STEP 5: Audit log
    await prisma.priceAuditLog.create({
      data: {
        rideGroupId: member.rideGroupId,
        bookingId: member.bookingId,
        routeVersion: member.rideGroup.routeVersion,
        totalRouteKm: 0, // no-show = 0 km
        directKm: member.kmDirect,
        detourKm: 0,
        detourPercent: 0,
        baseFarePerKm: member.flanvoFeeRate || 0.30,
        totalBaseFare: 0, // refunded
        driverRatePerKm: 2.00,
        totalDriverPay: member.driverShare || 0,
        flanvoFeeRate: 0,
        flanvoFee: 0, // refunded
        finalPrice: member.driverShare || 0, // only driver share charged
        maxDetourPercent: member.booking.maxDetourPercent,
        maxDetourMinutes: member.booking.maxDetourMinutes,
        constraintsMet: false,
        calculatedBy: 'system',
        notes: `NO-SHOW: Captured €${member.driverShare}, Refunded €${refundAmount}. ${reason || ''}`
      }
    });

    // TODO: Send no-show notification to passenger
    // await sendNoShowNotificationEmail(member.booking.user.email, {
    //   penalty: member.driverShare,
    //   refund: refundAmount
    // });

    return NextResponse.json({
      success: true,
      captured: true,
      penalty: member.driverShare,
      refunded: refundAmount,
      netCharge: member.driverShare,
      reason: 'No-show after 20 min wait. Driver share charged, service fee refunded.'
    });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Input non valido', details: error.errors }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}