import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { addToPenaltyPool } from '@/lib/payment-helpers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Validation schema
const refundSchema = z.object({
  memberId: z.string().cuid(),
  reason: z.string().min(10).max(500),
  cancellationTime: z.string().datetime().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId, reason, cancellationTime } = refundSchema.parse(body);

    const cancelTime = cancellationTime ? new Date(cancellationTime) : new Date();

    // Get GroupMember
    const member = await prisma.groupMember.findUnique({
      where: { id: memberId },
      include: {
        booking: {
          include: {
            user: true
          }
        },
        rideGroup: true
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

    if (member.paymentStatus === 'REFUNDED') {
      return NextResponse.json(
        { error: 'Already refunded' },
        { status: 400 }
      );
    }

    // Determine timing: PRE or POST T-40 (match lock)
    const matchLockTime = member.rideGroup.matchConfirmTime;
    
    if (!matchLockTime) {
      return NextResponse.json(
        { error: 'Match lock time not set' },
        { status: 400 }
      );
    }

    const isPostMatchLock = cancelTime > matchLockTime;

    const idempotencyKey = `refund-${memberId}-${Date.now()}`;

    // PRE T-40: Full refund (100%)
    if (!isPostMatchLock) {
      if (member.paymentStatus === 'AUTHORIZED') {
        // Cancel payment intent (not yet captured)
        await stripe.paymentIntents.cancel(member.paymentIntentId);
        
        await prisma.groupMember.update({
          where: { id: memberId },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'REFUNDED'
          }
        });

        return NextResponse.json({
          success: true,
          refunded: member.totalPrice,
          percentage: 100,
          reason: 'PRE match-lock cancellation - full refund',
          breakdown: {
            driverShare: 0,
            flanvoFee: member.flanvoFee,
            protectionFee: 1.00,
            totalRefund: member.totalPrice
          }
        });
      } else {
        // Payment already captured (rare case PRE T-40)
        const refund = await stripe.refunds.create({
          payment_intent: member.paymentIntentId,
          amount: Math.round(member.totalPrice! * 100),
          reason: 'requested_by_customer',
          metadata: {
            type: 'PRE_MATCH_LOCK_CANCELLATION',
            memberId: member.id
          }
        }, {
          idempotencyKey
        });

        await prisma.groupMember.update({
          where: { id: memberId },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'REFUNDED'
          }
        });

        return NextResponse.json({
          success: true,
          refunded: member.totalPrice,
          percentage: 100,
          reason: 'PRE match-lock cancellation - full refund'
        });
      }
    }

    // POST T-40: Partial refund
    // Capture driver share, refund flanvo fee + protection
    
    if (member.paymentStatus !== 'AUTHORIZED') {
      return NextResponse.json(
        { error: 'Payment not in correct state for refund' },
        { status: 400 }
      );
    }

    // STEP 1: Capture ONLY driver share (penalty)
    const captured = await stripe.paymentIntents.capture(
      member.paymentIntentId,
      {
        amount_to_capture: Math.round(member.driverShare! * 100)
      },
      {
        idempotencyKey: `${idempotencyKey}-capture`
      }
    );

    console.log(`POST T-40 cancellation capture: ${captured.id} - €${member.driverShare}`);

    // STEP 2: Refund flanvo fee + protection fee
    const refundAmount = (member.flanvoFee || 0) + 1.00;
    const refund = await stripe.refunds.create({
      payment_intent: member.paymentIntentId,
      amount: Math.round(refundAmount * 100),
      reason: 'requested_by_customer',
      metadata: {
        type: 'POST_MATCH_LOCK_CANCELLATION',
        memberId: member.id,
        reason
      }
    });

    console.log(`POST T-40 cancellation refund: ${refund.id} - €${refundAmount}`);

    // STEP 3: Add driver share to penalty pool (for price lock mechanism)
    await addToPenaltyPool(member.rideGroupId, member.driverShare!);

    // STEP 4: Update GroupMember
    await prisma.groupMember.update({
      where: { id: memberId },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        capturedAt: new Date()
      }
    });

    // STEP 5: Audit log
    await prisma.priceAuditLog.create({
      data: {
        rideGroupId: member.rideGroupId,
        bookingId: member.bookingId,
        routeVersion: member.rideGroup.routeVersion,
        totalRouteKm: 0,
        directKm: member.kmDirect,
        detourKm: 0,
        detourPercent: 0,
        baseFarePerKm: member.flanvoFeeRate || 0.30,
        totalBaseFare: 0,
        driverRatePerKm: 2.00,
        totalDriverPay: member.driverShare || 0,
        flanvoFeeRate: 0,
        flanvoFee: 0,
        finalPrice: member.driverShare || 0, // penalty
        maxDetourPercent: member.booking.maxDetourPercent,
        maxDetourMinutes: member.booking.maxDetourMinutes,
        constraintsMet: false,
        calculatedBy: 'system',
        notes: `POST T-40 CANCELLATION: Penalty €${member.driverShare}, Refund €${refundAmount}. Reason: ${reason}`
      }
    });

    // TODO: Send cancellation confirmation email
    // await sendCancellationEmail(member.booking.user.email, {
    //   penalty: member.driverShare,
    //   refund: refundAmount
    // });

    return NextResponse.json({
      success: true,
      refunded: refundAmount,
      penalty: member.driverShare,
      netCharge: member.driverShare,
      reason: 'POST match-lock cancellation',
      breakdown: {
        driverShare: `€${member.driverShare} - trattenuto (penalty)`,
        flanvoFee: `€${member.flanvoFee} - rimborsato`,
        protectionFee: '€1.00 - rimborsato',
        totalRefund: refundAmount,
        totalPenalty: member.driverShare
      }
    });

  } catch (error: any) {
    console.error('Refund error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Refund failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Refund processing failed' },
      { status: 500 }
    );
  }
}