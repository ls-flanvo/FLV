import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') || req.cookies.get('flanvo_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: {
        id: true, status: true,
        groupMember: {
          select: {
            rideGroup: {
              select: {
                status: true, currentCapacity: true, maxCapacity: true,
                members: { select: { id: true }, where: { status: { not: 'CANCELLED' } } },
              },
            },
          },
        },
      },
    });

    if (!booking) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });
    if (payload?.userId && booking.groupMember?.rideGroup) {
      const group = booking.groupMember.rideGroup;
      return NextResponse.json({
        status: booking.status,
        group: {
          status: group.status,
          current: group.currentCapacity,
          max: group.maxCapacity,
        },
      });
    }

    return NextResponse.json({ status: booking.status, group: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}
