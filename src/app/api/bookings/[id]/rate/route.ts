import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await requireAuth(request);
    const { rating, comment } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating deve essere tra 1 e 5' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        groupMember: {
          include: {
            rideGroup: { include: { ride: { include: { driver: true } } } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }
    if (booking.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Puoi valutare solo corse completate' }, { status: 400 });
    }
    if (booking.userRating) {
      return NextResponse.json({ error: 'Hai già valutato questa corsa' }, { status: 409 });
    }

    await prisma.booking.update({
      where: { id: params.id },
      data: { userRating: rating, ratingComment: comment ?? null },
    });

    const driver = booking.groupMember?.rideGroup?.ride?.driver;
    if (driver) {
      const allRatings = await prisma.booking.findMany({
        where: {
          groupMember: {
            rideGroup: { ride: { driverId: driver.id } },
          },
          userRating: { not: null },
        },
        select: { userRating: true },
      });

      if (allRatings.length > 0) {
        const avg =
          allRatings.reduce((sum, b) => sum + (b.userRating ?? 0), 0) /
          allRatings.length;

        await prisma.driver.update({
          where: { id: driver.id },
          data: { rating: Math.round(avg * 10) / 10 },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
