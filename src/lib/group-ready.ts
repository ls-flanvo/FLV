import { prisma } from '@/lib/prisma';
import { getPricingRates } from '@/lib/get-pricing-rates';
import { haversineDistance } from '@/lib/dbscan-clustering';
import { sendGroupReady, sendNewRideAvailable } from '@/lib/email';
import { createNotification } from '@/lib/notify';

const bookingSelect = {
  dropoffLat: true,
  dropoffLng: true,
  pickupLat: true,
  pickupLng: true,
  passengers: true,
  user: { select: { id: true, name: true, email: true } },
} as const;

const membersInclude = {
  include: { booking: { select: bookingSelect } },
} as const;

export async function checkAndCloseExpiredGroups() {
  try {
    const rates = await getPricingRates();
    const windowMs = rates.matchingWindowHours * 60 * 60 * 1000; // default 3h
    const thresholdTime = new Date(Date.now() + windowMs);

    // Chiudi se il volo parte entro 3h (flightDepartureTime) oppure, se non noto, se il pickup è entro 3h
    const expiredGroups = await prisma.rideGroup.findMany({
      where: {
        status: 'FORMING',
        currentCapacity: { gte: 2 },
        OR: [
          { flightDepartureTime: { lte: thresholdTime } },
          { flightDepartureTime: null, targetPickupTime: { lte: thresholdTime } },
        ],
      },
      select: {
        id: true, currentCapacity: true, targetPickupTime: true,
        flightDepartureTime: true, flightNumber: true, arrivalAirport: true,
        members: membersInclude,
      },
    });

    for (const group of expiredGroups) {
      await closeGroup(group, rates);
    }
  } catch (e) {
    console.error('checkAndCloseExpiredGroups error:', e);
  }
}

export async function closeGroupImmediately(groupId: string) {
  try {
    const rates = await getPricingRates();
    const group = await prisma.rideGroup.findUnique({
      where: { id: groupId },
      select: {
        id: true, currentCapacity: true, targetPickupTime: true,
        flightDepartureTime: true, flightNumber: true, arrivalAirport: true, status: true,
        members: membersInclude,
      },
    });
    if (!group || group.status !== 'FORMING') return;
    await closeGroup(group, rates);
  } catch (e) {
    console.error('closeGroupImmediately error:', e);
  }
}

type GroupForClose = {
  id: string;
  currentCapacity: number;
  targetPickupTime: Date;
  flightDepartureTime?: Date | null;
  flightNumber: string;
  arrivalAirport?: string | null;
  members: Array<{
    id: string;
    booking: {
      dropoffLat: number;
      dropoffLng: number;
      pickupLat: number;
      pickupLng: number;
      passengers: number;
      user: { id: string; name: string; email: string };
    };
  }>;
};

async function closeGroup(group: GroupForClose, rates: Awaited<ReturnType<typeof getPricingRates>>) {
  // Rifetch dei membri freschi dal DB — evita race condition con pgbouncer
  // dove il membro appena scritto non è visibile sulla connessione pooled iniziale
  const freshMembers = await prisma.groupMember.findMany({
    where: { rideGroupId: group.id },
    include: { booking: { select: bookingSelect } },
  });

  if (freshMembers.length === 0) return;

  const pickupLat = freshMembers[0].booking.pickupLat;
  const pickupLng = freshMembers[0].booking.pickupLng;
  const totalPax = group.currentCapacity;

  // Prezzo individuale per ogni prenotazione: distanza effettiva × passeggeri della prenotazione
  let totalGroupPrice = 0;
  const memberPrices: {
    memberId: string;
    bookingUserId: string;
    price: number;
    userName: string;
    userEmail: string;
  }[] = [];

  for (const member of freshMembers) {
    const kmOnboard = haversineDistance(
      pickupLat, pickupLng,
      member.booking.dropoffLat, member.booking.dropoffLng
    );
    const driverSharePerPerson = (kmOnboard * rates.driverRatePerKm) / totalPax;
    const flanvoRate = kmOnboard >= 100
      ? rates.flanvoTier3Rate
      : kmOnboard >= 51
        ? rates.flanvoTier2Rate
        : rates.flanvoTier1Rate;
    const pricePerPerson = driverSharePerPerson + kmOnboard * flanvoRate + rates.protectionFee;
    const totalPriceForBooking = Math.round(pricePerPerson * member.booking.passengers * 100) / 100;

    totalGroupPrice += totalPriceForBooking;
    memberPrices.push({
      memberId: member.id,
      bookingUserId: member.booking.user.id,
      price: totalPriceForBooking,
      userName: member.booking.user.name,
      userEmail: member.booking.user.email,
    });
  }

  // Gruppo CONFIRMED — in attesa del driver, passeggeri NON ancora invitati a pagare
  await prisma.rideGroup.update({
    where: { id: group.id },
    data: { status: 'CONFIRMED', totalPrice: Math.round(totalGroupPrice * 100) / 100 },
  });

  // Ogni booking → CONFIRMED (non MATCHED), salva driverShare nel GroupMember
  for (const member of freshMembers) {
    const mp = memberPrices.find(m => m.memberId === member.id);
    if (!mp) continue;
    const kmOnboard = haversineDistance(
      pickupLat, pickupLng,
      member.booking.dropoffLat, member.booking.dropoffLng
    );
    const flanvoRate = kmOnboard >= 100 ? rates.flanvoTier3Rate : kmOnboard >= 51 ? rates.flanvoTier2Rate : rates.flanvoTier1Rate;
    const driverSharePerPerson = (kmOnboard * rates.driverRatePerKm) / totalPax;
    const flanvoFee = kmOnboard * flanvoRate;

    await prisma.groupMember.update({
      where: { id: member.id },
      data: { kmOnboard, driverShare: driverSharePerPerson, flanvoFee, flanvoFeeRate: flanvoRate, totalPrice: mp.price },
    });
    await prisma.booking.updateMany({
      where: { groupMember: { id: member.id } },
      data: { status: 'CONFIRMED', estimatedPrice: mp.price },
    });
  }

  // Notifica passeggeri: gruppo completo, in attesa del driver
  for (const { bookingUserId, memberId, price } of memberPrices) {
    createNotification({
      userId: bookingUserId,
      type: 'GROUP_READY',
      title: 'Gruppo completo — In attesa del driver',
      body: `Il tuo gruppo per il volo ${group.flightNumber} è completo (${totalPax} passeggeri). Prezzo stimato: €${price.toFixed(2)}. Ti avvisiamo quando il driver accetta.`,
      data: { groupMemberId: memberId, flightNumber: group.flightNumber, price },
    }).catch(() => {});
  }

  // Notifica driver immediatamente
  await notifyDriversGroupReady(group.id);
}

// Chiamata da payments/authorize dopo che TUTTI i passeggeri hanno pagato
export async function notifyDriversGroupReady(rideGroupId: string) {
  try {
    const group = await prisma.rideGroup.findUnique({
      where: { id: rideGroupId },
      select: {
        flightNumber: true, currentCapacity: true, arrivalAirport: true,
        members: { select: { totalPrice: true } },
      },
    });
    if (!group) return;

    const totalEarnings = group.members.reduce((s, m) => s + (m.totalPrice ?? 0), 0);
    const airportCode = group.arrivalAirport ?? 'CTA';

    const drivers = await prisma.driver.findMany({
      where: { isVerified: true, isAvailable: true },
      select: { userId: true, user: { select: { email: true, name: true } } },
    });

    for (const d of drivers) {
      createNotification({
        userId: d.userId,
        type: 'GROUP_READY',
        title: 'Nuova corsa disponibile',
        body: `Volo ${group.flightNumber} — ${group.currentCapacity} passeggeri. Compenso totale: €${totalEarnings.toFixed(2)}. Accetta dalla dashboard.`,
        data: { rideGroupId, flightNumber: group.flightNumber, totalPax: group.currentCapacity, totalEarnings },
      }).catch(() => {});

      sendNewRideAvailable(d.user.email, {
        driverName: d.user.name ?? 'Driver',
        flightNumber: group.flightNumber,
        pax: group.currentCapacity,
        airportName: airportCode,
      }).catch(() => {});
    }
  } catch (e) {
    console.error('notifyDriversGroupReady error:', e);
  }
}
