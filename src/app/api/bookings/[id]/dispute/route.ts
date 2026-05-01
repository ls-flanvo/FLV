import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { createNotification } from '@/lib/notify';
import { z } from 'zod';

const schema = z.object({
  reason: z.enum(['LOST_LUGGAGE', 'MEDICAL', 'FLIGHT_ISSUE', 'DRIVER_ISSUE', 'OTHER']),
  description: z.string().min(20, 'Descrivi il problema in almeno 20 caratteri').max(1000),
});

const REASON_LABELS: Record<string, string> = {
  LOST_LUGGAGE: 'Bagaglio smarrito',
  MEDICAL: 'Emergenza medica',
  FLIGHT_ISSUE: 'Problemi con il volo',
  DRIVER_ISSUE: 'Problemi con il driver',
  OTHER: 'Altro',
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await requireAuth(req);
    const body = schema.parse(await req.json());

    const booking = await prisma.booking.findFirst({
      where: { id: params.id, userId: payload.userId },
      include: { groupMember: { select: { paymentStatus: true, totalPrice: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    // Blocca disputa doppia
    const existing = await prisma.dispute.findFirst({
      where: { bookingId: params.id, status: { not: 'REJECTED' } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Hai già aperto una disputa per questa prenotazione' }, { status: 409 });
    }

    const dispute = await prisma.dispute.create({
      data: {
        bookingId: params.id,
        userId: payload.userId,
        reason: body.reason,
        description: body.description,
      },
    });

    // Notifica admin
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    for (const admin of admins) {
      createNotification({
        userId: admin.id,
        type: 'GROUP_READY',
        title: 'Nuova disputa aperta',
        body: `${REASON_LABELS[body.reason]} — volo ${booking.flightNumber}. Richiede revisione.`,
        data: { disputeId: dispute.id, bookingId: params.id },
      }).catch(() => {});
    }

    // Notifica passeggero
    createNotification({
      userId: payload.userId,
      type: 'BOOKING_CONFIRMED',
      title: 'Disputa aperta',
      body: 'Il team Flanvo esaminerà la tua segnalazione entro 24 ore lavorative.',
      data: { disputeId: dispute.id },
    }).catch(() => {});

    return NextResponse.json({ success: true, disputeId: dispute.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await requireAuth(req);
    const dispute = await prisma.dispute.findFirst({
      where: { bookingId: params.id, userId: payload.userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ dispute });
  } catch (error) {
    return authErrorResponse(error);
  }
}
