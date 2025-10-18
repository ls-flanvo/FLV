import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateReceipt } from '@/lib/payment-helpers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Validation schema
const captureSchema = z.object({
  memberId: z.string().cuid(),
  actualKm: z.number().positive().optional() // Ignored (prezzo fisso)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId } = captureSchema.parse(body);

    // Get GroupMember with all data
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

    if (member.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Payment already captured' },
        { status: 400 }
      );
    }

    if (member.paymentStatus !== 'AUTHORIZED') {
      return NextResponse.json(
        { error: 'Payment not authorized yet' },
        { status: 400 }
      );
    }

    const driver = member.rideGroup.ride?.driver;
    if (!driver || !driver.stripeConnectedAccountId) {
      return NextResponse.json(
        { error: 'Driver not found or Stripe account not connected' },
        { status: 400 }
      );
    }

    // Idempotency key
    const idempotencyKey = `capture-${memberId}-${Date.now()}`;

    // STEP 1: Capture Payment Intent (full amount)
    const captured = await stripe.paymentIntents.capture(
      member.paymentIntentId,
      {
        amount_to_capture: Math.round(member.totalPrice! * 100)
      },
      {
        idempotencyKey
      }
    );

    console.log(`Captured payment: ${captured.id} - €${member.totalPrice}`);

    // STEP 2: Transfer driver share to driver
    const transfer = await stripe.transfers.create({
      amount: Math.round(member.driverShare! * 100),
      currency: 'eur',
      destination: driver.stripeConnectedAccountId,
      transfer_group: member.rideGroupId,
      metadata: {
        memberId: member.id,
        type: 'driver_earnings',
        kmOnboard: member.kmOnboard?.toString() || '0',
        rideDate: member.rideGroup.targetPickupTime.toISOString()
      }
    });

    console.log(`Transfer created: ${transfer.id} - €${member.driverShare} to driver ${driver.id}`);

    // STEP 3: Update GroupMember
    await prisma.groupMember.update({
      where: { id: memberId },
      data: {
        paymentStatus: 'PAID',
        capturedAt: new Date(),
        status: 'COMPLETED',
        actualDropoffTime: new Date()
      }
    });

    // STEP 4: Update driver earnings
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        totalEarnings: {
          increment: member.driverShare!
        },
        totalRides: {
          increment: 1
        }
      }
    });

    // STEP 5: Generate receipt
    const receipt = generateReceipt(member, captured);

    // TODO: Send receipt email
    // await sendReceiptEmail(member.booking.user.email, receipt);

    // STEP 6: Audit log
    await prisma.priceAuditLog.create({
      data: {
        rideGroupId: member.rideGroupId,
        bookingId: member.bookingId,
        routeVersion: member.rideGroup.routeVersion,
        totalRouteKm: member.rideGroup.totalRouteKm || 0,
        directKm: member.kmDirect,
        detourKm: member.detourKm,
        detourPercent: member.detourPercent,
        baseFarePerKm: member.flanvoFeeRate || 0.30,
        totalBaseFare: member.flanvoFee || 0,
        driverRatePerKm: 2.00,
        totalDriverPay: member.driverShare || 0,
        flanvoFeeRate: member.flanvoFeeRate || 0.30,
        flanvoFee: member.flanvoFee || 0,
        finalPrice: member.totalPrice || 0,
        maxDetourPercent: member.booking.maxDetourPercent,
        maxDetourMinutes: member.booking.maxDetourMinutes,
        constraintsMet: true,
        calculatedBy: 'system',
        notes: `Payment captured: ${captured.id}, Transfer: ${transfer.id}`
      }
    });

    return NextResponse.json({
      success: true,
      captured: true,
      amount: member.totalPrice,
      driverTransfer: member.driverShare,
      receipt
    });

  } catch (error: any) {
    console.error('Capture error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Capture failed', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Capture failed' },
      { status: 500 }
    );
  }
}