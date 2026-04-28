import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.APPLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/apple/callback`;

  if (!clientId) return NextResponse.json({ error: 'Apple OAuth non configurato' }, { status: 503 });

  const url = new URL('https://appleid.apple.com/auth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code id_token');
  url.searchParams.set('scope', 'name email');
  url.searchParams.set('response_mode', 'form_post');

  return NextResponse.redirect(url.toString());
}
