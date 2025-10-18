import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Validation schema
const authorizeSchema = z.object({
  paymentIntentId: z.string(),
  paymentMethodId: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentIntentId, paymentMethodId } = authorizeSchema.parse(body);

    // Get GroupMember by payment intent
    const member = await prisma.groupMember.findFirst({
      where: { paymentIntentId },
      include: {
        booking: {
          include: {
            user: true
          }
        }
      }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    // Check if already authorized
    if (member.paymentStatus === 'AUTHORIZED') {
      return NextResponse.json(
        { success: true, intentId: paymentIntentId, alreadyAuthorized: true }
      );
    }

    // Confirm Payment Intent (if paymentMethodId provided)
    let intent;
    if (paymentMethodId) {
      intent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`
      });
    } else {
      // Just retrieve to verify status
      intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    }

    // Verify authorization successful
    if (intent.status !== 'requires_capture') {
      return NextResponse.json(
        { error: `Payment not authorized. Status: ${intent.status}` },
        { status: 400 }
      );
    }

    // Update GroupMember status
    await prisma.groupMember.update({
      where: { id: member.id },
      data: {
        paymentStatus: 'AUTHORIZED'
      }
    });

    // TODO: Send confirmation email
    // await sendPaymentConfirmationEmail(member.booking.user.email, {
    //   amount: member.totalPrice,
    //   flightNumber: member.rideGroup.flightNumber
    // });

    console.log(`Payment authorized for member ${member.id}: €${member.totalPrice}`);

    return NextResponse.json({
      success: true,
      authorized: true,
      intentId: paymentIntentId,
      amount: member.totalPrice
    });

  } catch (error: any) {
    console.error('Authorization error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: 'Card declined', details: error.message },
        { status: 402 }
      );
    }

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid payment request', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Authorization failed' },
      { status: 500 }
    );
  }
}