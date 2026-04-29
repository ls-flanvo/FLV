import { prisma } from '@/lib/prisma';
import { getPricingRates } from '@/lib/get-pricing-rates';
import { haversineDistance } from '@/lib/dbscan-clustering';
import { sendGroupReady, sendNewRideAvailable } from '@/lib/email';
import { createNotification } from '@/lib/notify';

/**
 * Controlla i gruppi FORMING scaduti o pieni → li marca READY e notifica i membri.
 * Da chiamare in lazy-eval ad ogni nuova richiesta di booking o matching.
 */
export async function checkAndCloseExpiredGroups() {
  try {
    const rates = await getPricingRates();
    const windowMs = rates.matchingWindowHours * 60 * 60 * 1000;

    // Gruppi scaduti: finestra di accumulo chiusa (volo entro windowHours) + min 2 pax
    const expiredGroups = await prisma.rideGroup.findMany({
      where: {
        status: 'FORMING',
        currentCapacity: { gte: 2 },
        targetPickupTime: { lte: new Date(Date.now() + windowMs) },
      },
      include: {
        members: {
          include: {
            booking: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
      },
    });

    for (const group of expiredGroups) {
      await closeGroup(group, rates);
    }
  } catch (e) {
    console.error('checkAndCloseExpiredGroups error:', e);
  }
}

/**
 * Chiudi immediatamente un gruppo (es. van pieno a 7 pax).
 */
export async function closeGroupImmediately(groupId: string) {
  try {
    const rates = await getPricingRates();
    const group = await prisma.rideGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            booking: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
      },
    });
    if (!group || group.status !== 'FORMING') return;
    await closeGroup(group as Parameters<typeof closeGroup>[0], rates);
  } catch (e) {
    console.error('closeGroupImmediately error:', e);
  }
}

async function closeGroup(group: {
  id: string;
  currentCapacity: number;
  targetPickupTime: Date;
  flightNumber: string;
  members: Array<{
    id: string;
    booking: {
      dropoffLat: number;
      dropoffLng: number;
      pickupLat: number;
      pickupLng: number;
      user: { id: string; name: string; email: string };
    };
  }>;
}, rates: Awaited<ReturnType<typeof getPricingRates>>) {
  const memberBookings = group.members.map(m => m.booking);
  if (memberBookings.length === 0) return;

  // Calcola prezzo per persona basato su distanza media
  const avgDropLat = memberBookings.reduce((s, b) => s + b.dropoffLat, 0) / memberBookings.length;
  const avgDropLng = memberBookings.reduce((s, b) => s + b.dropoffLng, 0) / memberBookings.length;
  const pickupLat = memberBookings[0].pickupLat;
  const pickupLng = memberBookings[0].pickupLng;
  const estimatedKm = haversineDistance(pickupLat, pickupLng, avgDropLat, avgDropLng);

  const totalPax = group.currentCapacity;
  const driverShare = (estimatedKm * rates.driverRatePerKm) / totalPax;
  const flanvoRate = estimatedKm >= 100 ? rates.flanvoTier3Rate : estimatedKm >= 51 ? rates.flanvoTier2Rate : rates.flanvoTier1Rate;
  const pricePerPerson = Math.round((driverShare + estimatedKm * flanvoRate + rates.protectionFee) * 100) / 100;

  // Marca gruppo CONFIRMED (READY → CONFIRMED automatico per MVP, visibile ai driver)
  await prisma.rideGroup.update({
    where: { id: group.id },
    data: { status: 'CONFIRMED', totalPrice: pricePerPerson * totalPax },
  });

  // Aggiorna tutti i booking a MATCHED con prezzo finale
  for (const member of group.members) {
    await prisma.booking.updateMany({
      where: { groupMember: { id: member.id } },
      data: { status: 'MATCHED', estimatedPrice: pricePerPerson },
    });
  }

  // Notifica i driver disponibili nello stesso scalo del gruppo
  const availableDrivers = await prisma.driver.findMany({
    where: {
      isVerified: true,
      isAvailable: true,
      homeAirport: (group as { arrivalAirport?: string }).arrivalAirport ?? 'CTA',
    },
    select: { userId: true, user: { select: { email: true, name: true } } },
  });
  const airportName = (group as { arrivalAirport?: string }).arrivalAirport ?? 'CTA';
  for (const d of availableDrivers) {
    createNotification({
      userId: d.userId,
      type: 'GROUP_READY',
      title: 'Nuova corsa disponibile',
      body: `Volo ${group.flightNumber} — ${totalPax} passeggeri. Accetta dalla dashboard prima che qualcun altro la prenda.`,
      data: { rideGroupId: group.id, flightNumber: group.flightNumber, totalPax },
    }).catch(() => {});

    sendNewRideAvailable(d.user.email, {
      driverName: d.user.name ?? 'Driver',
      flightNumber: group.flightNumber,
      pax: totalPax,
      airportName,
    }).catch(() => {});
  }

  // Notifica in-app + email per tutti i membri
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flv-psi.vercel.app';
  for (const member of group.members) {
    createNotification({
      userId: member.booking.user.id,
      type: 'GROUP_READY',
      title: 'Gruppo trovato — Conferma e paga',
      body: `Il tuo gruppo per il volo ${group.flightNumber} è pronto. Sono ${totalPax} passeggeri — prezzo finale €${pricePerPerson.toFixed(2)} a persona.`,
      data: { groupMemberId: member.id, flightNumber: group.flightNumber, pricePerPerson },
    }).catch(() => {});

    sendGroupReady(member.booking.user.email, {
      userName: member.booking.user.name,
      flightNumber: group.flightNumber,
      groupSize: totalPax,
      pricePerPerson,
      groupMemberId: member.id,
      appUrl,
    }).catch(() => {});
  }
}
