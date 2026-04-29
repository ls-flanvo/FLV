import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';

// Registra o aggiorna la push subscription dell'utente
export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    const { endpoint, keys } = await req.json();

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Dati subscription non validi' }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: payload.userId, p256dh: keys.p256dh, auth: keys.auth },
      create: { userId: payload.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}

// Recupera VAPID public key per il frontend
export async function GET() {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? '' });
}
