import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notify';
import { sendNewRideAvailable, sendAdminNoCoverAlert } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

// Soglie relative all'orario di partenza del volo dall'aeroporto di origine
const WINDOW_ESCALATE_MS = 3 * 60 * 60 * 1000;  // D-3h → seconda notifica urgente (se il gruppo era già CONFIRMED prima)
const WINDOW_CANCEL_MS   = 2 * 60 * 60 * 1000;  // D-2h → hard deadline: cancel + rimborso
const MIN_CONFIRMED_MS   = 30 * 60 * 1000;       // Ignora gruppi confermati da meno di 30min (appena chiusi dal cron)

/**
 * GET /api/cron/escalate-groups?secret=xxx
 *
 * Timeline (riferimento: orario partenza volo dall'aeroporto di origine):
 *
 *   Gruppo pieno prima di D-3h → prima notifica driver al momento della chiusura
 *   D-3h → Gruppo chiuso dalla finestra di matching (se non ancora pieno) + prima notifica driver
 *           Se il gruppo era già CONFIRMED da >30min → seconda notifica urgente
 *   D-2h → Hard deadline: se ancora nessun driver → cancel automatico + rimborso + notifica passeggeri
 *           Il passeggero sa come sta 2 ore prima del decollo → ha tempo per organizzarsi
 *
 * Schedulare ogni 15 minuti su Vercel Cron.
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  // Soglie basate su orario partenza volo
  const cancelThreshold = new Date(now.getTime() + WINDOW_CANCEL_MS);    // partenza entro 1.5h
  const escalateThreshold = new Date(now.getTime() + WINDOW_ESCALATE_MS); // partenza entro 2h

  // Gruppi CONFIRMED senza driver con partenza imminente
  // Usa flightDepartureTime se disponibile, altrimenti cade sul targetPickupTime (fallback)
  const confirmedGroups = await prisma.rideGroup.findMany({
    where: {
      status: 'CONFIRMED',
      OR: [
        { flightDepartureTime: { lte: escalateThreshold } },
        { flightDepartureTime: null, targetPickupTime: { lte: escalateThreshold } },
      ],
    },
    include: {
      members: {
        where: { status: { not: 'CANCELLED' as const } },
        include: {
          booking: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      },
    },
    orderBy: { updatedAt: 'asc' },
  }) as unknown as GroupWithMembers[];

  let cancelled = 0;
  let escalated = 0;

  const recentlyConfirmedCutoff = new Date(now.getTime() - MIN_CONFIRMED_MS);

  for (const group of confirmedGroups) {
    const referenceTime = group.flightDepartureTime ?? group.targetPickupTime;
    const isPastCancelThreshold = referenceTime <= cancelThreshold;

    if (isPastCancelThreshold) {
      await autoCancel(group);
      cancelled++;
    } else if (!group.driverEscalatedAt) {
      // Salta se il gruppo è stato appena confermato (chiuso in questo stesso run del cron)
      // per evitare di mandare prima notifica + seconda notifica quasi contemporaneamente
      const justConfirmed = group.updatedAt >= recentlyConfirmedCutoff;
      if (justConfirmed) continue;

      await escalateDriverSearch(group);
      await prisma.rideGroup.update({
        where: { id: group.id },
        data: { driverEscalatedAt: now },
      });
      escalated++;
    }
  }

  return NextResponse.json({
    ok: true,
    ts: now.toISOString(),
    cancelled,
    escalated,
    checked: confirmedGroups.length,
  });
}

// ──────────────────────────────────────────────────────────────────────────────

interface GroupMemberWithBooking {
  id: string;
  paymentIntentId: string | null;
  paymentStatus: string | null;
  totalPrice: number | null;
  booking: { userId: string; user: { id: string; name: string; email: string } };
}

interface GroupWithMembers {
  id: string;
  flightNumber: string;
  arrivalAirport: string;
  currentCapacity: number;
  flightDepartureTime: Date | null;
  targetPickupTime: Date;
  driverEscalatedAt: Date | null;
  updatedAt: Date;
  members: GroupMemberWithBooking[];
}

async function autoCancel(group: GroupWithMembers) {
  const activePax = group.members;

  for (const member of activePax) {
    if (member.paymentIntentId && member.paymentStatus === 'CAPTURED') {
      const amountCents = Math.round((member.totalPrice ?? 0) * 100);
      if (amountCents > 0) {
        await stripe.refunds.create({
          payment_intent: member.paymentIntentId,
          metadata: { type: 'NO_DRIVER_AUTO_CANCEL', rideGroupId: group.id },
        }).catch(console.error);
      }
    }

    await prisma.groupMember.update({
      where: { id: member.id },
      data: {
        status: 'CANCELLED',
        ...(member.paymentStatus === 'CAPTURED' ? { paymentStatus: 'REFUNDED' } : {}),
      },
    });

    await prisma.booking.updateMany({
      where: { groupMember: { id: member.id } },
      data: { status: 'CANCELLED' },
    });

    const totalPrice = member.totalPrice ?? 0;
    createNotification({
      userId: member.booking.userId,
      type: 'BOOKING_CANCELLED',
      title: 'Nessun driver trovato — prenotazione annullata',
      body: member.paymentStatus === 'CAPTURED'
        ? `Spiacenti — nessun driver ha accettato la corsa per il volo ${group.flightNumber} in tempo. Rimborso di €${totalPrice.toFixed(2)} entro 5–7 giorni lavorativi.`
        : `Spiacenti — nessun driver ha accettato la corsa per il volo ${group.flightNumber}. Nessun addebito effettuato.`,
      data: { rideGroupId: group.id, flightNumber: group.flightNumber },
    }).catch(() => {});
  }

  await prisma.rideGroup.update({
    where: { id: group.id },
    data: { status: 'CANCELLED' },
  });

  const totalRefunded = activePax.reduce((s, m) => s + (m.paymentStatus === 'CAPTURED' ? (m.totalPrice ?? 0) : 0), 0);
  sendAdminNoCoverAlert({
    flightNumber: group.flightNumber,
    departureTime: group.flightDepartureTime ?? group.targetPickupTime,
    passengerCount: activePax.length,
    totalRefunded,
    rideGroupId: group.id,
  }).catch(() => {});

  console.log(`[escalate-groups] Auto-cancelled group ${group.id} (${group.flightNumber}), ${activePax.length} passengers notified.`);
}

async function escalateDriverSearch(group: GroupWithMembers) {
  const drivers = await prisma.driver.findMany({
    where: { isVerified: true, isAvailable: true },
    select: { userId: true, user: { select: { email: true, name: true } } },
  });

  const totalEarnings = group.members.reduce((s, m) => s + (m.totalPrice ?? 0), 0);
  const referenceTime = group.flightDepartureTime ?? group.targetPickupTime;
  const minutesLeft = Math.round((referenceTime.getTime() - Date.now()) / 60000);

  for (const driver of drivers) {
    createNotification({
      userId: driver.userId,
      type: 'GROUP_READY',
      title: '⚡ Corsa urgente — serve driver ora',
      body: `Volo ${group.flightNumber} parte tra ${minutesLeft} min — ${group.currentCapacity} passeggeri. Compenso: €${totalEarnings.toFixed(2)}. Accetta subito.`,
      data: { rideGroupId: group.id, urgent: true },
    }).catch(() => {});

    sendNewRideAvailable(driver.user.email, {
      driverName: driver.user.name ?? 'Driver',
      flightNumber: group.flightNumber,
      pax: group.currentCapacity,
      airportName: group.arrivalAirport ?? 'CTA',
    }).catch(() => {});
  }

  console.log(`[escalate-groups] Escalated group ${group.id} (${group.flightNumber}) to ${drivers.length} drivers, ${minutesLeft}min to departure.`);
}
