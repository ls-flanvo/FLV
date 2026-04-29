import { prisma } from './prisma';
import { sendPushToUser } from './push';

export type NotificationType =
  | 'GROUP_READY'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'RIDE_STARTED'
  | 'RIDE_COMPLETED';

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data ? JSON.parse(JSON.stringify(params.data)) : undefined,
      },
    });
    // Invia push notification se l'utente ha subscription attive
    sendPushToUser(params.userId, {
      title: params.title,
      body: params.body,
      url: params.data?.groupMemberId
        ? `/checkout/${params.data.groupMemberId}`
        : params.data?.bookingId
        ? '/dashboard'
        : '/dashboard',
    }).catch(() => {});
  } catch (e) {
    console.error('createNotification error:', e);
  }
}
