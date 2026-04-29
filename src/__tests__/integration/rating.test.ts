import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long!!';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    driver: { update: vi.fn() },
  },
}));

import { POST } from '@/app/api/bookings/[id]/rate/route';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';

async function makeRateRequest(bookingId: string, body: object) {
  const token = await generateToken({ userId: 'user-123', email: 'mario@test.com', role: 'user' });
  return new NextRequest(`http://localhost:3000/api/bookings/${bookingId}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

const mockCompletedBooking = {
  id: 'booking-123',
  userId: 'user-123',
  status: 'COMPLETED',
  userRating: null,
  groupMember: {
    rideGroup: {
      ride: {
        driver: { id: 'driver-456' },
      },
    },
  },
};

describe('POST /api/bookings/[id]/rate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('restituisce 400 se rating fuori range (0)', async () => {
    const req = await makeRateRequest('booking-123', { rating: 0 });
    const res = await POST(req, { params: { id: 'booking-123' } });
    expect(res.status).toBe(400);
  });

  it('restituisce 400 se rating fuori range (6)', async () => {
    const req = await makeRateRequest('booking-123', { rating: 6 });
    const res = await POST(req, { params: { id: 'booking-123' } });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('1 e 5');
  });

  it('restituisce 404 se booking non trovato', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);
    const req = await makeRateRequest('non-existent', { rating: 5 });
    const res = await POST(req, { params: { id: 'non-existent' } });
    expect(res.status).toBe(404);
  });

  it('restituisce 403 se booking appartiene a un altro utente', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      ...mockCompletedBooking,
      userId: 'altro-utente',
    } as any);
    const req = await makeRateRequest('booking-123', { rating: 4 });
    const res = await POST(req, { params: { id: 'booking-123' } });
    expect(res.status).toBe(403);
  });

  it('restituisce 400 se corsa non completata', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      ...mockCompletedBooking,
      status: 'IN_PROGRESS',
    } as any);
    const req = await makeRateRequest('booking-123', { rating: 5 });
    const res = await POST(req, { params: { id: 'booking-123' } });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('completate');
  });

  it('restituisce 409 se già valutato', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      ...mockCompletedBooking,
      userRating: 4,
    } as any);
    const req = await makeRateRequest('booking-123', { rating: 5 });
    const res = await POST(req, { params: { id: 'booking-123' } });
    expect(res.status).toBe(409);
  });

  it('salva rating correttamente', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockCompletedBooking as any);
    vi.mocked(prisma.booking.update).mockResolvedValue({} as any);
    vi.mocked(prisma.booking.findMany).mockResolvedValue([
      { userRating: 5 }, { userRating: 4 },
    ] as any);
    vi.mocked(prisma.driver.update).mockResolvedValue({} as any);

    const req = await makeRateRequest('booking-123', { rating: 5, comment: 'Ottimo autista!' });
    const res = await POST(req, { params: { id: 'booking-123' } });

    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.booking.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-123' },
        data: expect.objectContaining({ userRating: 5, ratingComment: 'Ottimo autista!' }),
      })
    );
  });

  it('aggiorna la media del driver dopo il rating', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockCompletedBooking as any);
    vi.mocked(prisma.booking.update).mockResolvedValue({} as any);
    // 5 + 4 + 3 = 12 / 3 = 4.0
    vi.mocked(prisma.booking.findMany).mockResolvedValue([
      { userRating: 5 }, { userRating: 4 }, { userRating: 3 },
    ] as any);
    vi.mocked(prisma.driver.update).mockResolvedValue({} as any);

    const req = await makeRateRequest('booking-123', { rating: 3 });
    await POST(req, { params: { id: 'booking-123' } });

    expect(vi.mocked(prisma.driver.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'driver-456' },
        data: { rating: 4.0 },
      })
    );
  });

  it('accetta rating senza commento', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockCompletedBooking as any);
    vi.mocked(prisma.booking.update).mockResolvedValue({} as any);
    vi.mocked(prisma.booking.findMany).mockResolvedValue([{ userRating: 5 }] as any);
    vi.mocked(prisma.driver.update).mockResolvedValue({} as any);

    const req = await makeRateRequest('booking-123', { rating: 5 });
    const res = await POST(req, { params: { id: 'booking-123' } });
    expect(res.status).toBe(200);
  });
});
