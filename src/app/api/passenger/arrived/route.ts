import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { createNotification } from '@/lib/notify';

const schema = z.object({
  bookingId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    const { bookingId } = schema.parse(await req.json());

    const member = await prisma.groupMember.findFirst({
      where: { bookingId },
      include: {
        booking: { select: { userId: true } },
        rideGroup: {
          include: {
            ride: {
              include: { driver: { select: { userId: true } } },
            },
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }
    if (member.booking.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    if (member.status === 'CANCELLED' || member.status === 'NO_SHOW') {
      return NextResponse.json({ error: 'Prenotazione non attiva' }, { status: 400 });
    }

    // Validazione: il volo deve essere atterrato o il no-show timer deve essere quasi raggiunto
    const flightLanded = member.rideGroup.flightStatus === 'landed';
    const noShowAt = member.rideGroup.noShowAvailableAt;
    const timeReached = noShowAt && new Date() >= new Date(noShowAt.getTime() - 30 * 60_000);
    if (!flightLanded && !timeReached) {
      return NextResponse.json(
        { error: 'Il volo non è ancora atterrato. Premi il pulsante quando sei all\'uscita arrivi.' },
        { status: 400 }
      );
    }

    if (member.arrivedAtPickup) {
      return NextResponse.json({
        success: true,
        arrivedAt: member.arrivedAtPickup.toISOString(),
        message: 'Presenza già segnalata',
      });
    }

    const now = new Date();
    await prisma.groupMember.update({
      where: { id: member.id },
      data: { arrivedAtPickup: now },
    });

    // Conta quanti passeggeri hanno premuto "sono qui" nel gruppo (incluso questo)
    const groupMembers = await prisma.groupMember.findMany({
      where: { rideGroupId: member.rideGroupId, status: { not: 'CANCELLED' } },
      select: { arrivedAtPickup: true },
    });
    const totalMembers = groupMembers.length;
    const arrivedCount = groupMembers.filter(m => m.arrivedAtPickup !== null).length;
    const allArrived = arrivedCount === totalMembers;

    // Notifica il driver con contatore e priorità crescente
    const driverUserId = member.rideGroup.ride?.driver?.userId;
    const meetingPoint = member.rideGroup.meetingPoint;
    if (driverUserId) {
      const title = allArrived
        ? `Tutti pronti! Spostati ora`
        : arrivedCount === 1
        ? `1/${totalMembers} passeggeri all'uscita`
        : `${arrivedCount}/${totalMembers} passeggeri all'uscita`;

      const body = allArrived
        ? `Tutti i passeggeri sono all'uscita arrivi. Raggiungi il punto di raccolta: ${meetingPoint ?? 'area NCC'}`
        : arrivedCount === 1
        ? `Il primo passeggero è uscito con i bagagli. Prepara il van — altri ${totalMembers - 1} in arrivo.`
        : `${arrivedCount} passeggeri su ${totalMembers} pronti. Puoi spostarti${meetingPoint ? ` a: ${meetingPoint}` : ''}.`;

      createNotification({
        userId: driverUserId,
        type: 'RIDE_STARTED',
        title,
        body,
        data: {
          rideGroupId: member.rideGroupId,
          arrivedAt: now.toISOString(),
          arrivedCount,
          totalMembers,
          allArrived,
          action: allArrived ? 'go_pickup_urgent' : arrivedCount === 1 ? 'standby' : 'go_pickup',
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      arrivedAt: now.toISOString(),
      message: 'Presenza segnalata al driver',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Input non valido' }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}
