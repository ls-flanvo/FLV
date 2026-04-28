import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email richiesta' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
    // Risposta sempre OK per non rivelare se l'email esiste
    if (!user) return NextResponse.json({ ok: true });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const token = await new SignJWT({ userId: user.id, type: 'reset-password' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Flanvo <noreply@flanvo.com>',
      to: user.email,
      subject: 'Reimposta la tua password — Flanvo',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0B0B0B;color:#fff;padding:32px;border-radius:16px">
          <h2 style="color:#00D1B2;margin-bottom:8px">Reimposta password</h2>
          <p style="color:#A1A1AA">Ciao ${user.name},</p>
          <p style="color:#A1A1AA">Hai richiesto il reset della password. Clicca il link qui sotto (valido 1 ora):</p>
          <a href="${url}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#00D1B2;color:#0B0B0B;font-weight:700;border-radius:12px;text-decoration:none">
            Reimposta password
          </a>
          <p style="color:#71717A;font-size:12px">Se non hai richiesto tu questo reset, ignora questa email.</p>
        </div>`,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
