import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authErrorResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      role: { not: 'ADMIN' },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role === 'driver') where.role = 'DRIVER';
    else if (role === 'passenger') where.role = 'PASSENGER';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
          _count: { select: { bookings: true } },
          driver: { select: { isVerified: true, rating: true, totalRides: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        role: u.role === 'PASSENGER' ? 'passenger' : u.role === 'DRIVER' ? 'driver' : 'admin',
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId e action sono obbligatori' }, { status: 400 });
    }

    if (action === 'suspend') {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: false },
      });
      return NextResponse.json({ success: true, message: 'Utente sospeso' });
    }

    if (action === 'activate') {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });
      return NextResponse.json({ success: true, message: 'Utente attivato' });
    }

    if (action === 'delete') {
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ success: true, message: 'Utente eliminato' });
    }

    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
