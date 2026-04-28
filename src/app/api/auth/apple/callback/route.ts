import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

export async function POST(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  try {
    const body = await req.formData();
    const idToken = body.get('id_token') as string;
    const userJson = body.get('user') as string | null;

    if (!idToken) return NextResponse.redirect(`${appUrl}/login?error=apple-no-token`);

    // Verifica il JWT di Apple con le sue chiavi pubbliche
    const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
      issuer: 'https://appleid.apple.com',
      audience: process.env.APPLE_CLIENT_ID,
    });

    const email = payload.email as string;
    if (!email) return NextResponse.redirect(`${appUrl}/login?error=apple-no-email`);

    // Apple manda il nome solo al primo accesso
    let name = email.split('@')[0];
    if (userJson) {
      try {
        const u = JSON.parse(userJson);
        if (u.name?.firstName) name = `${u.name.firstName} ${u.name.lastName || ''}`.trim();
      } catch { /* */ }
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name, password: '' } as Parameters<typeof prisma.user.create>[0]['data'],
      });
    }

    const role = user.role === 'DRIVER' ? 'driver' : user.role === 'ADMIN' ? 'admin' : 'user';
    const token = await generateToken({ userId: user.id, email: user.email, role });

    return NextResponse.redirect(`${appUrl}/auth/callback?token=${token}&role=${role}`);
  } catch (e) {
    console.error('Apple callback error:', e);
    return NextResponse.redirect(`${appUrl}/login?error=apple-error`);
  }
}
