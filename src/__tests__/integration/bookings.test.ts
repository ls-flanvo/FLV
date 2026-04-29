import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long!!';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    booking: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    rideGroup: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    groupMember: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/group-ready', () => ({
  checkAndCloseExpiredGroups: vi.fn().mockResolvedValue(undefined),
  closeGroupImmediately: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/get-pricing-rates', () => ({
  getPricingRates: vi.fn().mockResolvedValue({
    driverRatePerKm: 2.0,
    flanvoTier1Rate: 0.30,
    flanvoTier2Rate: 0.25,
    flanvoTier3Rate: 0.20,
    protectionFee: 2.50,
    matchingWindowHours: 3,
  }),
}));

vi.mock('@/lib/dbscan-clustering', () => ({
  haversineDistance: vi.fn().mockReturnValue(25),
}));

vi.mock('@/lib/notify', () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue(true),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

import { GET, POST } from '@/app/api/bookings/route';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';

async function makeAuthRequest(body: object | null, method = 'POST') {
  const token = await generateToken({ userId: 'user-123', email: 'mario@test.com', role: 'user' });
  return new NextRequest('http://localhost:3000/api/bookings', {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const validBookingBody = {
  pickupLocation: 'Aeroporto Catania',
  pickupLat: 37.47,
  pickupLng: 15.07,
  dropoffLocation: 'Via Roma 1, Palermo',
  dropoffLat: 38.12,
  dropoffLng: 13.36,
  pickupTime: '2026-06-01T10:00:00Z',
  flightNumber: 'AZ1234',
  flightDate: '2026-06-01',
  direction: 'FROM_AIRPORT',
  passengers: 1,
  luggage: 1,
};

const mockUser = { id: 'user-123', email: 'mario@test.com', name: 'Mario', role: 'PASSENGER', isActive: true };

describe('GET /api/bookings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('restituisce 401 senza token', async () => {
    const req = new NextRequest('http://localhost:3000/api/bookings', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('restituisce lista booking dell\'utente', async () => {
    vi.mocked(prisma.booking.findMany).mockResolvedValue([
      { id: 'b-1', flightNumber: 'AZ1234', status: 'PENDING' } as any,
    ]);
    const req = await makeAuthRequest(null, 'GET');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.bookings).toHaveLength(1);
    expect(data.bookings[0].flightNumber).toBe('AZ1234');
  });
});

describe('POST /api/bookings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('restituisce 401 senza token', async () => {
    const req = new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify(validBookingBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('restituisce 400 se mancano campi obbligatori', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    const req = await makeAuthRequest({ flightNumber: 'AZ1234' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('mancante');
  });

  it('restituisce 409 se prenotazione duplicata per lo stesso volo', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.booking.findFirst).mockResolvedValue({
      id: 'existing-booking', flightNumber: 'AZ1234', status: 'PENDING',
    } as any);
    const req = await makeAuthRequest(validBookingBody);
    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain('già una prenotazione');
    expect(data.bookingId).toBe('existing-booking');
  });

  it('crea booking con successo', async () => {
    const createdBooking = {
      id: 'new-booking-id', flightNumber: 'AZ1234', status: 'PENDING',
      estimatedPrice: null, passengers: 1, luggage: 1, pickupTime: new Date(),
    };
    const createdGroup = {
      id: 'group-1', status: 'FORMING', currentCapacity: 1, maxCapacity: 7, members: [],
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.booking.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.booking.create).mockResolvedValue(createdBooking as any);
    vi.mocked(prisma.booking.update).mockResolvedValue({ ...createdBooking, estimatedPrice: 18.5 } as any);
    vi.mocked(prisma.rideGroup.create).mockResolvedValue(createdGroup as any);
    vi.mocked(prisma.rideGroup.findUnique).mockResolvedValue({ currentCapacity: 1, maxCapacity: 7 } as any);
    vi.mocked(prisma.groupMember.create).mockResolvedValue({ id: 'member-1', status: 'PENDING' } as any);

    const req = await makeAuthRequest(validBookingBody);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.booking.id).toBe('new-booking-id');
    expect(data.booking.flightNumber).toBe('AZ1234');
    expect(data.success).toBe(true);
  });

  it('normalizza flightNumber in uppercase', async () => {
    const createdBooking = { id: 'b-2', flightNumber: 'AZ1234', status: 'PENDING', passengers: 1, luggage: 1, pickupTime: new Date() };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.booking.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.booking.create).mockResolvedValue(createdBooking as any);
    vi.mocked(prisma.booking.update).mockResolvedValue(createdBooking as any);
    vi.mocked(prisma.rideGroup.create).mockResolvedValue({ id: 'g-1', members: [], currentCapacity: 1, maxCapacity: 7 } as any);
    vi.mocked(prisma.rideGroup.findUnique).mockResolvedValue({ currentCapacity: 1, maxCapacity: 7 } as any);
    vi.mocked(prisma.groupMember.create).mockResolvedValue({ id: 'm-1', status: 'PENDING' } as any);

    const req = await makeAuthRequest({ ...validBookingBody, flightNumber: 'az1234' });
    await POST(req);

    // Verifica che il duplicate check usi il codice in uppercase
    expect(vi.mocked(prisma.booking.findFirst)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ flightNumber: 'AZ1234' }),
      })
    );
  });
});
