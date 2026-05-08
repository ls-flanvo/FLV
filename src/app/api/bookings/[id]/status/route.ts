import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await requireAuth(request);

    const booking = await prisma.booking.findFirst({
      where: { id: params.id, userId: payload.userId },
      select: {
        status: true,
        groupMember: {
          select: {
            rideGroup: {
              select: {
                status: true,
                currentCapacity: true,
                maxCapacity: true,
                paymentWindowExpiresAt: true,
              },
            },
          },
        },
      },
    });

    if (!booking) return NextResponse.json({ error: 'Non trovata' }, { status: 404 });

    const rideGroup = booking.groupMember?.rideGroup;

    return NextResponse.json({
      status: booking.status,
      groupStatus: rideGroup?.status ?? null,
      group: rideGroup
        ? { current: rideGroup.currentCapacity, max: rideGroup.maxCapacity }
        : null,
      paymentWindowExpiresAt: rideGroup?.paymentWindowExpiresAt?.toISOString() ?? null,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
