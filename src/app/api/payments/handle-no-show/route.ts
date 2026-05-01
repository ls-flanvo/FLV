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

// 15 min dal meeting time (che è già landing + 25 min bagagli)
// Il driver deve prima contattare il passeggero via chat, poi attendere 15 min
const WAIT_AFTER_MEETING_MS = 15 * 60 * 1000;

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

    // Il pagamento è già catturato al momento dell'accettazione del driver.
    // No-show: il driver era presente, ha contattato il passeggero via chat e ha atteso 15 min.
    // Driver riceve: driverShare (compensazione presenza e attesa)
    // Flanvo rimborsa al passeggero: flanvoFee + protectionFee (la propria quota)
    // Passeggero paga solo: driverShare (penale per il no-show)

    if (member.paymentStatus !== 'CAPTURED') {
      return NextResponse.json({ error: 'Pagamento non ancora catturato' }, { status: 400 });
    }

    // Transfer quota driver — compensazione per presenza e attesa
    const transfer = await stripe.transfers.create({
      amount: Math.round(member.driverShare! * 100),
      currency: 'eur',
      destination: driver.stripeConnectedAccountId,
      metadata: {
        memberId: member.id,
        type: 'no_show_compensation',
        reason: reason || 'Passenger no-show after 15 min wait + chat contact',
      },
    });

    // Rimborso parziale al passeggero: Flanvo restituisce la propria fee
    // Quota Flanvo = totalPrice - driverShare (include flanvoFee + protectionFee)
    const flanvoQuota = (member.totalPrice ?? 0) - (member.driverShare ?? 0);
    const flanvoRefundCents = Math.round(Math.max(0, flanvoQuota) * 100);
    if (flanvoRefundCents > 0) {
      await stripe.refunds.create({
        payment_intent: member.paymentIntentId,
        amount: flanvoRefundCents,
        metadata: { type: 'NO_SHOW_FLANVO_FEE_REFUND', memberId: member.id },
      }).catch(console.error);
    }

    console.log(`No-show: transfer €${member.driverShare} to driver, refund €${flanvoRefundCents / 100} flanvo fee to passenger`);

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
        notes: `NO-SHOW: Driver compensato €${member.driverShare}. Fee Flanvo trattenuta. ${reason || ''}`
      }
    });

    // TODO: Send no-show notification to passenger
    // await sendNoShowNotificationEmail(member.booking.user.email, {
    //   penalty: member.driverShare,
    //   refund: refundAmount
    // });

    return NextResponse.json({
      success: true,
      driverPaid: member.driverShare,
      flanvoRefunded: flanvoRefundCents / 100,
      message: 'Driver compensato per presenza e attesa. Fee Flanvo rimborsata al passeggero. Per forza maggiore documentata aprire disputa.',
    });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Input non valido', details: error.errors }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}