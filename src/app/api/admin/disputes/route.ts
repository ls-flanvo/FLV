import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authErrorResponse } from '@/lib/api-auth';
import { createNotification } from '@/lib/notify';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'PENDING';

    const disputes = await prisma.dispute.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        booking: {
          select: {
            flightNumber: true, pickupTime: true,
            groupMember: { select: { id: true, paymentStatus: true, totalPrice: true, paymentIntentId: true } },
          },
        },
      },
    });

    return NextResponse.json({ disputes });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = await requireAdmin(req);
    const { disputeId, action, resolution, refundAmount } = await req.json();

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: { groupMember: { select: { paymentIntentId: true, totalPrice: true, id: true } } },
        },
        user: { select: { id: true, name: true } },
      },
    });

    if (!dispute) return NextResponse.json({ error: 'Disputa non trovata' }, { status: 404 });
    if (dispute.status !== 'PENDING') {
      return NextResponse.json({ error: 'Disputa già risolta' }, { status: 409 });
    }

    let actualRefund = 0;

    if (action === 'APPROVED') {
      const member = dispute.booking.groupMember;
      if (member?.paymentIntentId && (member as { paymentStatus?: string }).paymentStatus === 'CAPTURED') {
        const amountCents = Math.round((refundAmount ?? member.totalPrice ?? 0) * 100);
        if (amountCents > 0) {
          await stripe.refunds.create({
            payment_intent: member.paymentIntentId,
            amount: amountCents,
            metadata: { type: 'DISPUTE_REFUND', disputeId, adminId: payload.userId },
          }).catch(console.error);
        }
        await prisma.groupMember.update({
          where: { id: member.id },
          data: { paymentStatus: 'REFUNDED' },
        });
        actualRefund = refundAmount ?? member.totalPrice ?? 0;
      }
    }

    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: action === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        resolution,
        refundAmount: actualRefund || undefined,
        resolvedAt: new Date(),
        resolvedBy: payload.userId,
      },
    });

    createNotification({
      userId: dispute.userId,
      type: 'BOOKING_CONFIRMED',
      title: action === 'APPROVED' ? 'Disputa approvata' : 'Disputa respinta',
      body: action === 'APPROVED'
        ? `La tua disputa è stata approvata. Rimborso di €${actualRefund.toFixed(2)} in elaborazione.`
        : `La tua disputa è stata respinta. Motivo: ${resolution}`,
      data: { disputeId },
    }).catch(() => {});

    return NextResponse.json({ success: true, refundAmount: actualRefund });
  } catch (error) {
    return authErrorResponse(error);
  }
}
