import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password || password.length < 6)
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    if (payload.type !== 'reset-password' || !payload.userId)
      return NextResponse.json({ error: 'Token non valido' }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: payload.userId as string }, data: { password: hashed } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Token scaduto o non valido' }, { status: 400 });
  }
}
