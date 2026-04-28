import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDriver, authErrorResponse } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const payload = await requireDriver(request);
    const { lat, lng } = await request.json();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'lat e lng sono obbligatori' }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: payload.userId },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver non trovato' }, { status: 404 });
    }

    await prisma.driver.update({
      where: { id: driver.id },
      data: { currentLat: lat, currentLng: lng, lastLocationAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    if (!driverId) {
      return NextResponse.json({ error: 'driverId obbligatorio' }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { currentLat: true, currentLng: true, lastLocationAt: true },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver non trovato' }, { status: 404 });
    }

    return NextResponse.json({ location: driver });
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
