import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    // CRITICAL: Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Webhook received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      case 'refund.created':
        await handleRefundCreated(event.data.object as Stripe.Refund);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // ALWAYS return 200 (even if processing fails internally)
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    // Still return 200 to avoid Stripe retries
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// Handler: payment_intent.succeeded
async function handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
  try {
    const member = await prisma.groupMember.findFirst({
      where: { paymentIntentId: intent.id }
    });

    if (!member) {
      console.error(`GroupMember not found for intent ${intent.id}`);
      return;
    }

    // Update to AUTHORIZED (funds are held)
    await prisma.groupMember.update({
      where: { id: member.id },
      data: {
        paymentStatus: 'AUTHORIZED'
      }
    });

    console.log(`Payment authorized for member ${member.id}: €${intent.amount / 100}`);

    // TODO: Send confirmation email
    // await sendPaymentAuthorizedEmail(member);

  } catch (error: any) {
    console.error('Error handling payment_intent.succeeded:', error);
  }
}

// Handler: payment_intent.payment_failed
async function handlePaymentIntentFailed(intent: Stripe.PaymentIntent) {
  try {
    const member = await prisma.groupMember.findFirst({
      where: { paymentIntentId: intent.id },
      include: {
        booking: {
          include: {
            user: true
          }
        }
      }
    });

    if (!member) {
      console.error(`GroupMember not found for intent ${intent.id}`);
      return;
    }

    // Mark as FAILED
    await prisma.groupMember.update({
      where: { id: member.id },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED' // Remove from pool
      }
    });

    console.error(`Payment FAILED for member ${member.id}: ${intent.last_payment_error?.message}`);

    // TODO: Notify passenger to update payment method
    // await sendPaymentFailedEmail(member.booking.user.email, {
    //   error: intent.last_payment_error?.message,
    //   amount: intent.amount / 100
    // });

    // TODO: Check if pool still valid (min 2 members)
    // If pool < 2 members, cancel entire group

  } catch (error: any) {
    console.error('Error handling payment_intent.payment_failed:', error);
  }
}

// Handler: payment_intent.canceled
async function handlePaymentIntentCanceled(intent: Stripe.PaymentIntent) {
  try {
    const member = await prisma.groupMember.findFirst({
      where: { paymentIntentId: intent.id }
    });

    if (!member) {
      console.error(`GroupMember not found for intent ${intent.id}`);
      return;
    }

    // Update status (if not already updated)
    if (member.paymentStatus !== 'REFUNDED') {
      await prisma.groupMember.update({
        where: { id: member.id },
        data: {
          paymentStatus: 'CANCELLED'
        }
      });
    }

    console.log(`Payment intent cancelled for member ${member.id}`);

  } catch (error: any) {
    console.error('Error handling payment_intent.canceled:', error);
  }
}

// Handler: transfer.created
async function handleTransferCreated(transfer: Stripe.Transfer) {
  try {
    const memberId = transfer.metadata?.memberId;
    const type = transfer.metadata?.type;

    if (!memberId) {
      console.log('Transfer created without memberId metadata');
      return;
    }

    console.log(`Transfer created: ${transfer.id} - €${transfer.amount / 100} (${type || 'unknown'})`);

    // Log successful payout
    // Could add a PayoutLog table to track all transfers

    // TODO: Notify driver about incoming payment
    // if (type === 'driver_earnings' || type === 'no_show_compensation') {
    //   await notifyDriverPayout(transfer);
    // }

  } catch (error: any) {
    console.error('Error handling transfer.created:', error);
  }
}

// Handler: refund.created
async function handleRefundCreated(refund: Stripe.Refund) {
  try {
    const paymentIntentId = typeof refund.payment_intent === 'string' 
      ? refund.payment_intent 
      : refund.payment_intent?.id;

    if (!paymentIntentId) {
      console.error('Refund without payment_intent');
      return;
    }

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
      console.error(`GroupMember not found for refund ${refund.id}`);
      return;
    }

    console.log(`Refund processed: ${refund.id} - €${refund.amount / 100} for member ${member.id}`);

    // TODO: Send refund confirmation email
    // await sendRefundConfirmationEmail(member.booking.user.email, {
    //   amount: refund.amount / 100,
    //   reason: refund.reason
    // });

  } catch (error: any) {
    console.error('Error handling refund.created:', error);
  }
}

// Disable body parsing (Stripe needs raw body)
export const config = {
  api: {
    bodyParser: false
  }
};