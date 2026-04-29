import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  try {
    const code = req.nextUrl.searchParams.get('code');
    if (!code) return NextResponse.redirect(`${appUrl}/login?error=oauth-cancelled`);

    const redirectUri = `${new URL(req.url).origin}/api/auth/google/callback`;

    // Scambia il code per un access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return NextResponse.redirect(`${appUrl}/login?error=oauth-failed`);

    // Ottieni profilo utente
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profile.email) return NextResponse.redirect(`${appUrl}/login?error=oauth-no-email`);

    // Trova o crea utente
    let user = await prisma.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email as string,
          name: (profile.name || profile.email.split('@')[0]) as string,
          password: '',
        } as Parameters<typeof prisma.user.create>[0]['data'],
      });
    }

    const role = user.role === 'DRIVER' ? 'driver' : user.role === 'ADMIN' ? 'admin' : 'user';
    const token = await generateToken({ userId: user.id, email: user.email, role });

    const destination = role === 'driver' ? '/driver/dashboard' : role === 'admin' ? '/admin/dashboard' : '/dashboard';
    const response = NextResponse.redirect(`${appUrl}${destination}`);
    response.cookies.set('flanvo_token', token, { httpOnly: true, sameSite: 'strict', maxAge: 604800, path: '/' });

    // Passa token via query per il client store
    return NextResponse.redirect(`${appUrl}/auth/callback?token=${token}&role=${role}`);
  } catch (e) {
    console.error('Google callback error:', e);
    return NextResponse.redirect(`${appUrl}/login?error=oauth-error`);
  }
}
