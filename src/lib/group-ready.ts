import { prisma } from '@/lib/prisma';
import { getPricingRates } from '@/lib/get-pricing-rates';
import { haversineDistance } from '@/lib/dbscan-clustering';
import { sendNewRideAvailable } from '@/lib/email';
import { createNotification } from '@/lib/notify';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const bookingSelect = {
  id: true,
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

// ─────────────────────────────────────────────────────────────────────────────
// CHIUSURA GRUPPO — scatta quando il gruppo è pieno (7/7) o alla soglia T-3h
// ─────────────────────────────────────────────────────────────────────────────

export async function checkAndCloseExpiredGroups() {
  try {
    const rates = await getPricingRates();
    const windowMs = rates.matchingWindowHours * 60 * 60 * 1000;
    const thresholdTime = new Date(Date.now() + windowMs);

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

    // Processa finestre di pagamento scadute
    await processExpiredPaymentWindows();

    // Rimborsa gruppi CONFIRMED senza driver a T-1h dal volo
    await processNoDriverTimeout();
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
      id: string;
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
  // Rifetch fresco — evita race condition pgbouncer
  const freshMembers = await prisma.groupMember.findMany({
    where: { rideGroupId: group.id, status: { not: 'CANCELLED' } },
    include: { booking: { select: bookingSelect } },
  });
  if (freshMembers.length === 0) return;

  const pickupLat = freshMembers[0].booking.pickupLat;
  const pickupLng = freshMembers[0].booking.pickupLng;
  const totalPax = group.currentCapacity;
  const now = new Date();
  const windowExpiresAt = new Date(now.getTime() + rates.paymentWindowMinutes * 60 * 1000);

  let totalGroupPrice = 0;
  type MemberPrice = {
    memberId: string;
    bookingId: string;
    bookingUserId: string;
    frozenPrice: number;         // prezzo totale del booking (persona × pax)
    pricePerPerson: number;      // prezzo per singola persona fisica
    driverSharePerPerson: number;
    flanvoFee: number;
    flanvoRate: number;
    kmOnboard: number;
    userName: string;
    userEmail: string;
    bookingPassengers: number;
  };
  const memberPrices: MemberPrice[] = [];

  for (const member of freshMembers) {
    const kmOnboard = haversineDistance(
      pickupLat, pickupLng,
      member.booking.dropoffLat, member.booking.dropoffLng
    );
    const flanvoRate = kmOnboard >= 100
      ? rates.flanvoTier3Rate
      : kmOnboard >= 51
        ? rates.flanvoTier2Rate
        : rates.flanvoTier1Rate;

    // NUOVO: driver guadagna km-rate/pax + bonus per passeggero fisico
    const driverSharePerPerson = (kmOnboard * rates.driverRatePerKm) / totalPax + rates.driverBonusPerPax;
    const flanvoFee = kmOnboard * flanvoRate;
    const pricePerPerson = driverSharePerPerson + flanvoFee + rates.protectionFee;
    const frozenPrice = Math.round(pricePerPerson * member.booking.passengers * 100) / 100;

    totalGroupPrice += frozenPrice;
    memberPrices.push({
      memberId: member.id,
      bookingId: member.booking.id,
      bookingUserId: member.booking.user.id,
      frozenPrice,
      pricePerPerson,
      driverSharePerPerson,
      flanvoFee,
      flanvoRate,
      kmOnboard,
      userName: member.booking.user.name,
      userEmail: member.booking.user.email,
      bookingPassengers: member.booking.passengers,
    });
  }

  // Apri la finestra di pagamento sul gruppo
  await prisma.rideGroup.update({
    where: { id: group.id },
    data: {
      status: 'PAYMENT_WINDOW',
      paymentWindowOpenedAt: now,
      paymentWindowExpiresAt: windowExpiresAt,
      totalPrice: Math.round(totalGroupPrice * 100) / 100,
    },
  });

  // Salva prezzo congelato e share driver su ogni membro + booking → MATCHED
  for (const mp of memberPrices) {
    await prisma.groupMember.update({
      where: { id: mp.memberId },
      data: {
        kmOnboard: mp.kmOnboard,
        driverShare: mp.driverSharePerPerson,
        flanvoFee: mp.flanvoFee,
        flanvoFeeRate: mp.flanvoRate,
        totalPrice: mp.frozenPrice,
        frozenPrice: mp.frozenPrice,
      },
    });
    await prisma.booking.update({
      where: { id: mp.bookingId },
      data: { status: 'MATCHED', estimatedPrice: mp.frozenPrice },
    });
  }

  // Notifica passeggeri: paga ora entro 20 minuti
  const deadline = windowExpiresAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  for (const mp of memberPrices) {
    createNotification({
      userId: mp.bookingUserId,
      type: 'GROUP_READY',
      title: `Gruppo chiuso — Paga €${mp.frozenPrice.toFixed(2)} entro le ${deadline}`,
      body: `Il tuo gruppo per il volo ${group.flightNumber} è pronto. Hai 20 minuti per confermare il pagamento e assicurarti il posto.`,
      data: {
        groupMemberId: mp.memberId,
        bookingId: mp.bookingId,
        frozenPrice: mp.frozenPrice,
        paymentWindowExpiresAt: windowExpiresAt.toISOString(),
        action: 'PAY_NOW',
      },
    }).catch(() => {});
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESSING FINESTRA SCADUTA — chiamato dal cron ogni 5 minuti
// ─────────────────────────────────────────────────────────────────────────────

export async function processExpiredPaymentWindows() {
  const now = new Date();

  // Invia reminder a chi non ha ancora pagato (T+10min e T+17min)
  await sendPaymentReminders(now);

  // Processa finestre scadute
  const expiredGroups = await prisma.rideGroup.findMany({
    where: {
      status: 'PAYMENT_WINDOW',
      paymentWindowExpiresAt: { lte: now },
    },
    include: {
      members: {
        where: { status: { not: 'CANCELLED' } },
        include: {
          booking: { select: bookingSelect },
        },
      },
    },
  });

  for (const group of expiredGroups) {
    await processPaymentWindow(group);
  }
}

async function sendPaymentReminders(now: Date) {
  const min10 = new Date(now.getTime() - 10 * 60 * 1000);
  const min17 = new Date(now.getTime() - 17 * 60 * 1000);
  const cronWindow = 5 * 60 * 1000; // finestra di 5 min del cron

  // Gruppi aperti da ~10 minuti fa
  const groups10 = await prisma.rideGroup.findMany({
    where: {
      status: 'PAYMENT_WINDOW',
      paymentWindowOpenedAt: {
        gte: new Date(min10.getTime() - cronWindow),
        lte: min10,
      },
    },
    include: {
      members: {
        where: { status: { not: 'CANCELLED' }, paymentStatus: { not: 'CAPTURED' } },
        include: { booking: { select: bookingSelect } },
      },
    },
  });

  for (const group of groups10) {
    const deadline = group.paymentWindowExpiresAt?.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    for (const member of group.members) {
      createNotification({
        userId: member.booking.user.id,
        type: 'GROUP_READY',
        title: 'Ti restano 10 minuti — Completa il pagamento',
        body: `Non perdere il posto nel gruppo per il volo ${group.flightNumber}. Scadenza: ${deadline ?? '–'}.`,
        data: { groupMemberId: member.id, bookingId: member.bookingId, action: 'PAY_NOW' },
      }).catch(() => {});
    }
  }

  // Gruppi aperti da ~17 minuti fa
  const groups17 = await prisma.rideGroup.findMany({
    where: {
      status: 'PAYMENT_WINDOW',
      paymentWindowOpenedAt: {
        gte: new Date(min17.getTime() - cronWindow),
        lte: min17,
      },
    },
    include: {
      members: {
        where: { status: { not: 'CANCELLED' }, paymentStatus: { not: 'CAPTURED' } },
        include: { booking: { select: bookingSelect } },
      },
    },
  });

  for (const group of groups17) {
    for (const member of group.members) {
      createNotification({
        userId: member.booking.user.id,
        type: 'GROUP_READY',
        title: '⚠️ Ultimi 3 minuti — Stai per perdere il posto',
        body: `Completa subito il pagamento per il volo ${group.flightNumber}. Il posto verrà liberato automaticamente tra poco.`,
        data: { groupMemberId: member.id, bookingId: member.bookingId, action: 'PAY_NOW' },
      }).catch(() => {});
    }
  }
}

type GroupWithMembers = Awaited<ReturnType<typeof prisma.rideGroup.findMany<{
  include: {
    members: {
      where: { status: { not: 'CANCELLED' } };
      include: { booking: { select: typeof bookingSelect } };
    };
  };
}>>>[number];

async function processPaymentWindow(group: GroupWithMembers & {
  members: Array<{
    id: string; bookingId: string; paymentStatus: string;
    paymentIntentId: string | null; status: string;
    booking: { id: string; user: { id: string; name: string; email: string }; passengers: number };
  }>;
}) {
  const paidMembers = group.members.filter(m => m.paymentStatus === 'CAPTURED');
  const unpaidMembers = group.members.filter(m => m.paymentStatus !== 'CAPTURED');

  if (paidMembers.length < 3) {
    await cancelGroupWithRefunds(group, paidMembers, unpaidMembers);
    return;
  }

  // Rimuovi chi non ha pagato
  for (const member of unpaidMembers) {
    await prisma.groupMember.update({ where: { id: member.id }, data: { status: 'CANCELLED' } });
    await prisma.booking.update({ where: { id: member.bookingId }, data: { status: 'CANCELLED' } });
    createNotification({
      userId: member.booking.user.id,
      type: 'BOOKING_CANCELLED',
      title: 'Posto perso — Tempo scaduto',
      body: `Non hai completato il pagamento entro i 20 minuti per il volo ${group.flightNumber}. Il tuo posto è stato liberato.`,
      data: { flightNumber: group.flightNumber },
    }).catch(() => {});
  }

  // Gruppo → CONFIRMED — ora visibile ai driver
  await prisma.rideGroup.update({
    where: { id: group.id },
    data: { status: 'CONFIRMED' },
  });

  // Notifica passeggeri paganti: posto confermato
  for (const member of paidMembers) {
    createNotification({
      userId: member.booking.user.id,
      type: 'GROUP_READY',
      title: 'Posto confermato — In attesa del driver',
      body: `Il tuo posto per il volo ${group.flightNumber} è confermato. Ti avvisiamo non appena un driver accetta la corsa.`,
      data: { flightNumber: group.flightNumber },
    }).catch(() => {});
  }

  // Notifica driver
  await notifyDriversGroupReady(group.id);
}

async function cancelGroupWithRefunds(
  group: { id: string; flightNumber: string },
  paidMembers: Array<{ id: string; bookingId: string; paymentIntentId: string | null; booking: { user: { id: string } } }>,
  unpaidMembers: Array<{ id: string; bookingId: string; booking: { user: { id: string } } }>
) {
  // Rimborsa chi aveva pagato
  for (const member of paidMembers) {
    if (member.paymentIntentId) {
      try {
        await stripe.refunds.create({ payment_intent: member.paymentIntentId });
        await prisma.groupMember.update({ where: { id: member.id }, data: { paymentStatus: 'REFUNDED' } });
      } catch (e) { console.error('Refund failed for member', member.id, e); }
    }
    await prisma.booking.update({ where: { id: member.bookingId }, data: { status: 'CANCELLED' } });
    createNotification({
      userId: member.booking.user.id,
      type: 'BOOKING_CANCELLED',
      title: 'Corsa annullata — Rimborso in arrivo',
      body: `Il gruppo per il volo ${group.flightNumber} non ha raggiunto il numero minimo di passeggeri. Riceverai un rimborso completo entro 5 giorni.`,
      data: { flightNumber: group.flightNumber },
    }).catch(() => {});
  }

  // Annulla anche gli unpaid (nessun rimborso — non hanno mai pagato)
  for (const member of unpaidMembers) {
    await prisma.groupMember.update({ where: { id: member.id }, data: { status: 'CANCELLED' } });
    await prisma.booking.update({ where: { id: member.bookingId }, data: { status: 'CANCELLED' } });
    createNotification({
      userId: member.booking.user.id,
      type: 'BOOKING_CANCELLED',
      title: 'Corsa annullata',
      body: `Il gruppo per il volo ${group.flightNumber} non ha raggiunto il numero minimo. Nessun addebito è stato effettuato.`,
      data: { flightNumber: group.flightNumber },
    }).catch(() => {});
  }

  await prisma.rideGroup.update({ where: { id: group.id }, data: { status: 'CANCELLED' } });
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMEOUT DRIVER — rimborso automatico se nessun driver accetta entro T-1h
// ─────────────────────────────────────────────────────────────────────────────

export async function processNoDriverTimeout() {
  const cutoff = new Date(Date.now() + 60 * 60 * 1000); // T-1h dal pickup

  // Gruppi CONFIRMED (pagati) senza driver, con pickup imminente
  const timedOutGroups = await prisma.rideGroup.findMany({
    where: {
      status: 'CONFIRMED',
      ride: { is: null },           // nessun driver assegnato
      OR: [
        { flightDepartureTime: { lte: cutoff } },
        { flightDepartureTime: null, targetPickupTime: { lte: cutoff } },
      ],
    },
    include: {
      members: {
        where: { status: { not: 'CANCELLED' } },
        include: { booking: { select: { id: true, user: { select: { id: true } } } } },
      },
    },
  });

  for (const group of timedOutGroups) {
    // Rimborsa tutti i paganti
    for (const member of group.members) {
      if (member.paymentIntentId && member.paymentStatus === 'CAPTURED') {
        try {
          await stripe.refunds.create({ payment_intent: member.paymentIntentId });
          await prisma.groupMember.update({ where: { id: member.id }, data: { paymentStatus: 'REFUNDED' } });
        } catch (e) { console.error('Refund failed', member.id, e); }
      }
      await prisma.booking.update({ where: { id: member.booking.id }, data: { status: 'CANCELLED' } });
      await prisma.groupMember.update({ where: { id: member.id }, data: { status: 'CANCELLED' } });

      createNotification({
        userId: member.booking.user.id,
        type: 'BOOKING_CANCELLED',
        title: 'Nessun driver disponibile — Rimborso in arrivo',
        body: `Nessun driver ha accettato la corsa per il volo ${group.flightNumber} in tempo. Riceverai un rimborso completo entro 5 giorni.`,
        data: { flightNumber: group.flightNumber },
      }).catch(() => {});
    }

    await prisma.rideGroup.update({ where: { id: group.id }, data: { status: 'CANCELLED' } });
    console.log(`[NoDriverTimeout] Gruppo ${group.id} (${group.flightNumber}) annullato e rimborsato`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICA DRIVER — chiamata dopo che i pagamenti sono stati acquisiti
// ─────────────────────────────────────────────────────────────────────────────

export async function notifyDriversGroupReady(rideGroupId: string) {
  try {
    const group = await prisma.rideGroup.findUnique({
      where: { id: rideGroupId },
      select: {
        flightNumber: true, currentCapacity: true, arrivalAirport: true, totalRouteKm: true,
        members: {
          where: { paymentStatus: 'CAPTURED', status: { not: 'CANCELLED' } },
          select: { driverShare: true, booking: { select: { passengers: true } } },
        },
      },
    });
    if (!group) return;

    // Guadagno driver = sum(driverShare × passengers fisici del booking)
    const driverEarnings = group.members.reduce(
      (s, m) => s + (m.driverShare ?? 0) * (m.booking?.passengers ?? 1), 0
    );
    const paidPax = group.members.reduce((s, m) => s + (m.booking?.passengers ?? 1), 0);
    const airportCode = group.arrivalAirport ?? 'CTA';

    const drivers = await prisma.driver.findMany({
      where: { isVerified: true, isAvailable: true },
      select: { userId: true, user: { select: { email: true, name: true } } },
    });

    for (const d of drivers) {
      createNotification({
        userId: d.userId,
        type: 'GROUP_READY',
        title: 'Nuova corsa disponibile — Già pagata',
        body: `Volo ${group.flightNumber} — ${paidPax} passeggeri${group.totalRouteKm ? ` · ${Math.round(group.totalRouteKm)} km` : ''}. Guadagno garantito: €${driverEarnings.toFixed(2)}.`,
        data: { rideGroupId, flightNumber: group.flightNumber, totalPax: paidPax, driverEarnings },
      }).catch(() => {});

      sendNewRideAvailable(d.user.email, {
        driverName: d.user.name ?? 'Driver',
        flightNumber: group.flightNumber,
        pax: paidPax,
        airportName: airportCode,
      }).catch(() => {});
    }
  } catch (e) {
    console.error('notifyDriversGroupReady error:', e);
  }
}
