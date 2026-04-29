import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Env necessario per JWT
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long!!';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

import { POST } from '@/app/api/auth/login/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function makeRequest(body: object) {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const mockUser = {
  id: 'user-123',
  email: 'mario@test.com',
  password: '$2b$12$hashedpassword',
  name: 'Mario Rossi',
  role: 'PASSENGER',
  driver: null,
};

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restituisce 400 se email o password mancano', async () => {
    const res = await POST(makeRequest({ email: 'test@test.com' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('obbligatori');
  });

  it('restituisce 401 se utente non esiste', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const res = await POST(makeRequest({ email: 'ghost@test.com', password: 'wrong' }));
    expect(res.status).toBe(401);
  });

  it('restituisce 401 se password errata', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const res = await POST(makeRequest({ email: 'mario@test.com', password: 'wrongpassword' }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Credenziali non valide');
  });

  it('login ok — restituisce user con role=user e token JWT', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const res = await POST(makeRequest({ email: 'mario@test.com', password: 'correctpassword' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.role).toBe('user');
    expect(data.user.email).toBe('mario@test.com');
    expect(typeof data.token).toBe('string');
    expect(data.token.length).toBeGreaterThan(50);
  });

  it('mappa role DRIVER → driver', async () => {
    const driverUser = { ...mockUser, role: 'DRIVER', driver: { isVerified: true } };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(driverUser as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const res = await POST(makeRequest({ email: 'driver@test.com', password: 'pw' }));
    const data = await res.json();
    expect(data.user.role).toBe('driver');
  });

  it('restituisce 403 se driver non ancora verificato', async () => {
    const pendingDriver = { ...mockUser, role: 'DRIVER', driver: { isVerified: false } };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(pendingDriver as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const res = await POST(makeRequest({ email: 'driver@test.com', password: 'pw' }));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('approvazione');
  });

  it('mappa role ADMIN → admin', async () => {
    const adminUser = { ...mockUser, role: 'ADMIN', driver: null };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(adminUser as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const res = await POST(makeRequest({ email: 'admin@flanvo.com', password: 'pw' }));
    const data = await res.json();
    expect(data.user.role).toBe('admin');
  });

  it('imposta cookie flanvo_token nella response', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const res = await POST(makeRequest({ email: 'mario@test.com', password: 'pw' }));
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('flanvo_token');
    expect(setCookie).toContain('HttpOnly');
  });
});
