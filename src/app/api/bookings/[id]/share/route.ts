import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';
import { SignJWT } from 'jose';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://flv-psi.vercel.app';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await requireAuth(request);

    const booking = await prisma.booking.findFirst({
      where: { id: params.id, userId: payload.userId },
      include: {
        groupMember: { select: { rideGroupId: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    // Token pubblico valido 48 ore — contiene solo bookingId (no dati sensibili)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'flanvo-public-track');
    const token = await new SignJWT({ bookingId: booking.id, pub: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('48h')
      .sign(secret);

    const publicUrl = `${APP_URL}/track/public/${token}`;

    return NextResponse.json({ url: publicUrl, expiresIn: '48 ore' });
  } catch (error) {
    return authErrorResponse(error);
  }
}
