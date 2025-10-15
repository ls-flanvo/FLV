import { SignJWT, jwtVerify } from 'jose';

// Tipo per il payload del token
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'USER' | 'DRIVER' | 'ADMIN';
}

// Ottieni la chiave segreta dal .env
const getSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  return new TextEncoder().encode(secret);
};

/**
 * Genera un JWT token
 * @param payload - Dati da includere nel token (userId, email, role)
 * @returns Token JWT come stringa
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  try {
    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Token valido per 7 giorni
      .sign(getSecretKey());

    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate token');
  }
}

/**
 * Verifica e decodifica un JWT token
 * @param token - Token JWT da verificare
 * @returns Payload decodificato se valido
 * @throws Error se token invalido o scaduto
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as 'USER' | 'DRIVER' | 'ADMIN',
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Estrae il token dal header Authorization
 * @param authHeader - Header Authorization dalla richiesta
 * @returns Token senza il prefisso "Bearer "
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Decodifica un token senza verificarlo (SOLO per debug/logging)
 * NON usare per autenticazione! Usa sempre verifyToken()
 */
export function decodeTokenUnsafe(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );
    
    return payload;
  } catch (error) {
    return null;
  }
}