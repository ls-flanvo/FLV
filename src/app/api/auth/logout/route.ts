import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logout effettuato' });
  response.cookies.set('flanvo_token', '', { maxAge: 0, path: '/' });
  return response;
}
