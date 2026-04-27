import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '@/lib/jwt';

export class AuthError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const authHeader = request.headers.get('Authorization');
  const tokenFromHeader = extractTokenFromHeader(authHeader);
  const tokenFromCookie = request.cookies.get('flanvo_token')?.value ?? null;
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    throw new AuthError(401, 'Token mancante');
  }

  try {
    return await verifyToken(token);
  } catch {
    throw new AuthError(401, 'Token non valido o scaduto');
  }
}

export async function requireDriver(request: NextRequest): Promise<JWTPayload> {
  const payload = await requireAuth(request);
  if (payload.role !== 'driver') {
    throw new AuthError(403, 'Accesso riservato agli autisti');
  }
  return payload;
}

export async function requireAdmin(request: NextRequest): Promise<JWTPayload> {
  const payload = await requireAuth(request);
  if (payload.role !== 'admin') {
    throw new AuthError(403, 'Accesso riservato agli amministratori');
  }
  return payload;
}

export function authErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  return NextResponse.json({ error: 'Errore di autenticazione' }, { status: 401 });
}
