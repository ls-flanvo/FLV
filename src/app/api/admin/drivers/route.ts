import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, authErrorResponse } from '@/lib/api-auth';
import { sendDriverApproved, sendDriverRejected } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending' | 'verified' | null (all)

    const where: Record<string, unknown> = {};
    if (status === 'pending') where.isVerified = false;
    else if (status === 'verified') where.isVerified = true;

    const drivers = await prisma.driver.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, createdAt: true },
        },
      },
    });

    return NextResponse.json({ drivers });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { driverId, action, reason } = await request.json();

    if (!driverId || !action) {
      return NextResponse.json({ error: 'driverId e action sono obbligatori' }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Autista non trovato' }, { status: 404 });
    }

    if (action === 'approve') {
      await prisma.driver.update({
        where: { id: driverId },
        data: { isVerified: true },
      });
      sendDriverApproved(driver.user.email, driver.user.name).catch(() => {});
      return NextResponse.json({
        success: true,
        message: `Autista ${driver.user.name} approvato`,
      });
    }

    if (action === 'reject') {
      await prisma.driver.delete({ where: { id: driverId } });
      await prisma.user.delete({ where: { id: driver.userId } });
      sendDriverRejected(driver.user.email, driver.user.name, reason).catch(() => {});
      return NextResponse.json({
        success: true,
        message: `Candidatura di ${driver.user.name} rifiutata`,
      });
    }

    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
