import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';

export async function PATCH(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    await prisma.notification.updateMany({
      where: { userId: payload.userId, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
