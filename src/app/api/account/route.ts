import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

async function getUser(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') || req.cookies.get('flanvo_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.userId) return null;
  return prisma.user.findUnique({ where: { id: payload.userId as string } });
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, isVerified: user.isVerified } });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { name, phone, currentPassword, newPassword } = await req.json();
  const updates: Record<string, string> = {};

  if (name?.trim()) updates.name = name.trim();
  if (phone?.trim()) updates.phone = phone.trim();

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: 'Password attuale richiesta' }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: 'Nuova password minimo 6 caratteri' }, { status: 400 });
    const valid = user.password ? await bcrypt.compare(currentPassword, user.password) : false;
    if (!valid) return NextResponse.json({ error: 'Password attuale non corretta' }, { status: 400 });
    updates.password = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 });

  const updated = await prisma.user.update({ where: { id: user.id }, data: updates, select: { id: true, name: true, email: true, phone: true } });
  return NextResponse.json({ user: updated });
}
