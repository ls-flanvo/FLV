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

    // payment_intent.requires_capture: utente ha completato il form Stripe (pre-auth OK)
    if ((event.type as string) === 'payment_intent.requires_capture') {
      await handlePaymentRequiresCapture(event.data.object as Stripe.PaymentIntent);
      return NextResponse.json({ received: true }, { status: 200 });
    }

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

// Handler: payment_intent.requires_capture
// Scatta quando l'utente completa il form Stripe (pre-auth = fondi bloccati)
async function handlePaymentRequiresCapture(intent: Stripe.PaymentIntent) {
  try {
    const member = await prisma.groupMember.findFirst({
      where: { paymentIntentId: intent.id },
      include: {
        booking: { include: { user: { select: { email: true, name: true } } } },
        rideGroup: { select: { flightNumber: true, targetPickupTime: true } },
      },
    });

    if (!member) {
      console.error(`GroupMember not found for intent ${intent.id}`);
      return;
    }

    // Aggiorna GroupMember: pre-auth autorizzata
    await prisma.groupMember.update({
      where: { id: member.id },
      data: { paymentStatus: 'AUTHORIZED', status: 'CONFIRMED' },
    });

    // Aggiorna Booking: da PENDING a CONFIRMED
    await prisma.booking.update({
      where: { id: member.bookingId },
      data: { status: 'CONFIRMED' },
    });

    console.log(`Pre-auth OK → Booking CONFIRMED: ${member.bookingId} | €${intent.amount / 100}`);

    // Email conferma prenotazione
    const { sendBookingConfirmation } = await import('@/lib/email');
    sendBookingConfirmation(member.booking.user.email, {
      flightNumber: member.rideGroup.flightNumber,
      pickupTime: member.rideGroup.targetPickupTime.toISOString(),
      estimatedPrice: intent.amount / 100,
    }).catch(() => {});

  } catch (error) {
    console.error('Error handling payment_intent.requires_capture:', error);
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
        booking: { include: { user: { select: { email: true, name: true } } } },
        rideGroup: { select: { id: true, flightNumber: true } },
      },
    });

    if (!member) return;

    await prisma.groupMember.update({
      where: { id: member.id },
      data: { paymentStatus: 'FAILED', status: 'CANCELLED' },
    });

    console.error(`Payment FAILED for member ${member.id}: ${intent.last_payment_error?.message}`);

    // Notifica l'utente
    const { createNotification } = await import('@/lib/notify');
    await createNotification({
      userId: member.booking.userId,
      type: 'PAYMENT_FAILED',
      title: 'Pagamento fallito',
      body: `Il pagamento per il volo ${member.rideGroup.flightNumber} non è andato a buon fine. Aggiorna il metodo di pagamento.`,
      data: { groupMemberId: member.id },
    });

    // Controlla se il gruppo ha ancora abbastanza membri (min 2)
    const activeMembers = await prisma.groupMember.count({
      where: { rideGroupId: member.rideGroupId, status: { not: 'CANCELLED' } },
    });

    if (activeMembers < 2) {
      await prisma.rideGroup.update({
        where: { id: member.rideGroupId },
        data: { status: 'CANCELLED' },
      });
      console.log(`Gruppo ${member.rideGroupId} cancellato: meno di 2 membri attivi`);
    }
  } catch (error) {
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
          paymentStatus: 'FAILED'
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

    // Notifica driver del pagamento ricevuto
    if (type === 'driver_earnings' || type === 'no_show_compensation') {
      try {
        const driver = await prisma.driver.findFirst({
          where: { stripeConnectedAccountId: transfer.destination as string },
          select: { userId: true },
        });
        if (driver) {
          const { createNotification } = await import('@/lib/notify');
          await createNotification({
            userId: driver.userId,
            type: 'PAYMENT_RECEIVED',
            title: 'Pagamento ricevuto',
            body: `Hai ricevuto €${(transfer.amount / 100).toFixed(2)} su Stripe${type === 'no_show_compensation' ? ' (compensazione no-show)' : ''}.`,
            data: { transferId: transfer.id },
          });
        }
      } catch { /* non bloccare il webhook */ }
    }

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
        booking: { include: { user: { select: { email: true } } } },
        rideGroup: { select: { flightNumber: true } },
      },
    });

    if (!member) {
      console.error(`GroupMember not found for refund ${refund.id}`);
      return;
    }

    console.log(`Refund processed: ${refund.id} - €${refund.amount / 100} for member ${member.id}`);

    await prisma.groupMember.update({
      where: { id: member.id },
      data: { paymentStatus: 'REFUNDED' },
    });

    const { createNotification } = await import('@/lib/notify');
    await createNotification({
      userId: member.booking.userId,
      type: 'REFUND_PROCESSED',
      title: 'Rimborso elaborato',
      body: `Rimborso di €${(refund.amount / 100).toFixed(2)} elaborato — arriverà entro 5–7 giorni lavorativi.`,
      data: { refundId: refund.id },
    });

    const { sendCancellationConfirmed } = await import('@/lib/email');
    // Determina il tipo di rimborso dal metadata Stripe
    const refundMeta = refund.metadata?.type ?? '';
    const refundType: 'full' | 'fee' =
      refundMeta === 'DISPUTE_ACCEPTED' ? 'fee' : 'full';
    sendCancellationConfirmed(member.booking.user.email, {
      flightNumber: member.rideGroup?.flightNumber ?? '',
      refundType,
    }).catch(() => {});

  } catch (error: any) {
    console.error('Error handling refund.created:', error);
  }
}

// Next.js App Router legge il body raw automaticamente nelle route handlers