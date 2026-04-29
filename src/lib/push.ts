import webpush from 'web-push';
import { prisma } from './prisma';

webpush.setVapidDetails(
  'mailto:noreply@flanvo.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    const data = JSON.stringify({ ...payload, icon: '/icon-192.png', badge: '/icon-192.png' });
    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            data
          );
        } catch (e: unknown) {
          // Subscription scaduta → rimuovi dal DB
          if ((e as { statusCode?: number })?.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }
      })
    );
  } catch { /* non bloccare il flusso principale */ }
}
