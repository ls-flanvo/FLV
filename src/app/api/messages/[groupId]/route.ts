import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, authErrorResponse } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const payload = await requireAuth(request);

    const membership = await prisma.groupMember.findFirst({
      where: { rideGroupId: params.groupId, booking: { userId: payload.userId } },
    });
    const isDriver = await prisma.driver.findFirst({
      where: {
        userId: payload.userId,
        rides: { some: { rideGroup: { id: params.groupId } } },
      },
    });

    if (!membership && !isDriver) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const messages = await prisma.rideMessage.findMany({
      where: { rideGroupId: params.groupId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        isDriver: m.isDriver,
        senderName: m.user.name,
        isMe: m.userId === payload.userId,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const payload = await requireAuth(request);
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Messaggio vuoto' }, { status: 400 });
    }

    const isDriver = !!(await prisma.driver.findFirst({
      where: {
        userId: payload.userId,
        rides: { some: { rideGroup: { id: params.groupId } } },
      },
    }));

    const message = await prisma.rideMessage.create({
      data: {
        rideGroupId: params.groupId,
        userId: payload.userId,
        content: content.trim(),
        isDriver,
      },
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        isDriver: message.isDriver,
        senderName: message.user.name,
        isMe: true,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
