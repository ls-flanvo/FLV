// src/lib/group-helpers.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Struttura per il pricing di un membro
 */
export interface MemberPricing {
  driverShare: number;
  flanvoFee: number;
  totalPrice: number;
}

/**
 * Struttura per un membro con km
 */
export interface MemberWithKm {
  kmOnboard: number;
}

/**
 * Calcola il pricing EQUO per tutti i membri del gruppo
 * Driver cost: UGUALE per tutti i passeggeri
 * Flanvo fee: PROPORZIONALE ai km effettivi
 */
export function calculateEquoPricing(
  totalVehicleCost: number,
  members: MemberWithKm[]
): MemberPricing[] {
  const totalPassengers = members.length;
  
  if (totalPassengers === 0) {
    return [];
  }
  
  // Driver cost diviso equamente tra tutti
  const driverSharePerPax = totalVehicleCost / totalPassengers;
  
  return members.map(member => {
    const flanvoRate = getFlanvoRate(member.kmOnboard);
    const flanvoFee = member.kmOnboard * flanvoRate;
    
    return {
      driverShare: Math.round(driverSharePerPax * 100) / 100,
      flanvoFee: Math.round(flanvoFee * 100) / 100,
      totalPrice: Math.round((driverSharePerPax + flanvoFee) * 100) / 100
    };
  });
}

/**
 * Ottiene il rate Flanvo basato sui km percorsi
 * - 0-50km: €0.30/km
 * - 51-99km: €0.25/km
 * - ≥100km: €0.20/km
 */
export function getFlanvoRate(kmOnboard: number): number {
  if (kmOnboard <= 50) return 0.30;
  if (kmOnboard <= 99) return 0.25;
  return 0.20;
}

/**
 * Calcola il quality score di un gruppo basato su:
 * - Numero di passeggeri
 * - Deviazione della rotta (km extra rispetto al percorso diretto)
 * - Distribuzione geografica dei pickup/dropoff
 */
export function calculateQualityScore(
  totalPassengers: number,
  totalRouteKm: number,
  directKmSum: number
): number {
  // Base score per numero passeggeri (più pax = meglio)
  const paxScore = Math.min(100, (totalPassengers / 7) * 50);
  
  // Efficiency score (meno deviazione = meglio)
  const efficiency = directKmSum > 0 ? (directKmSum / totalRouteKm) : 0;
  const efficiencyScore = efficiency * 50;
  
  return Math.round(Math.min(100, paxScore + efficiencyScore));
}

/**
 * Determina il tier del gruppo basato sul quality score
 */
export function getGroupTier(qualityScore: number): 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' {
  if (qualityScore >= 85) return 'EXCELLENT';
  if (qualityScore >= 70) return 'GOOD';
  return 'ACCEPTABLE';
}

/**
 * Valida che un gruppo possa essere confermato
 */
export function validateGroupForConfirmation(
  totalPassengers: number,
  qualityScore: number,
  allMembersConfirmed: boolean
): { valid: boolean; reason?: string } {
  if (!allMembersConfirmed) {
    return { valid: false, reason: 'Not all members have confirmed' };
  }
  
  if (totalPassengers < 2) {
    return { valid: false, reason: 'Minimum 2 passengers required' };
  }
  
  // Se sono solo 2 passeggeri, richiediamo quality score più alto
  if (totalPassengers === 2 && qualityScore < 70) {
    return { valid: false, reason: 'Quality score too low for 2-passenger group (min: 70)' };
  }
  
  return { valid: true };
}

/**
 * Ricalcola la rotta ottimizzata del gruppo usando Mapbox Optimization API
 */
export async function recalculateGroupRoute(groupId: string) {
  try {
    // Recupera il gruppo con i membri
    const group = await prisma.rideGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            booking: true
          }
        }
      }
    });
    
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Prepara i waypoints per l'ottimizzazione
    // NOTA: Lo schema non ha campi airportLat/airportLng nel Booking
    // Dobbiamo usare i campi pickup/dropoff in base alla direction
    const waypoints = [
      {
        type: 'AIRPORT' as const,
        latitude: group.members[0].booking.pickupLat,
        longitude: group.members[0].booking.pickupLng,
        address: 'Airport',
        sequence: 0
      },
      ...group.members.flatMap((member, idx) => [
        {
          type: 'PICKUP' as const,
          latitude: member.booking.pickupLat,
          longitude: member.booking.pickupLng,
          address: member.booking.pickupLocation,
          bookingId: member.bookingId,
          sequence: idx + 1
        },
        {
          type: 'DROPOFF' as const,
          latitude: member.booking.dropoffLat,
          longitude: member.booking.dropoffLng,
          address: member.booking.dropoffLocation,
          bookingId: member.bookingId,
          sequence: group.members.length + idx + 1
        }
      ])
    ];
    
    // TODO: Implementare chiamata a Mapbox Optimization API
    // Per ora restituiamo i waypoints ordinati come sono
    
    // Elimina i waypoints esistenti
    await prisma.groupRoute.deleteMany({
      where: { rideGroupId: groupId }
    });
    
    // Crea i nuovi waypoints ottimizzati
    await prisma.groupRoute.createMany({
      data: waypoints.map((wp, idx) => ({
        rideGroupId: groupId,
        sequence: idx,
        type: wp.type,
        latitude: wp.latitude,
        longitude: wp.longitude,
        address: wp.address,
        bookingId: wp.bookingId || null,
        estimatedArrival: new Date() // TODO: calcolare timing reali
      }))
    });
    
    return waypoints;
  } catch (error) {
    console.error('Error recalculating group route:', error);
    throw error;
  }
}

/**
 * Crea notifiche per i membri del gruppo
 */
export async function notifyGroupMembers(
  groupId: string,
  type: 'MEMBER_ADDED' | 'MEMBER_REMOVED' | 'PRICE_CHANGED' | 'GROUP_CONFIRMED',
  excludeMemberId?: string
) {
  try {
    const group = await prisma.rideGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            booking: true
          }
        }
      }
    });
    
    if (!group) return;
    
    const notifications = group.members
      .filter(member => member.id !== excludeMemberId)
      .map(member => ({
        userId: member.booking.userId,
        type,
        title: getNotificationTitle(type),
        message: getNotificationMessage(type, group),
        data: {
          groupId,
          memberId: member.id
        }
      }));
    
    // TODO: Implementare sistema di notifiche
    // await prisma.notification.createMany({ data: notifications });
    
    console.log(`Created ${notifications.length} notifications of type ${type}`);
  } catch (error) {
    console.error('Error notifying group members:', error);
  }
}

function getNotificationTitle(type: string): string {
  const titles = {
    MEMBER_ADDED: 'New Member Joined',
    MEMBER_REMOVED: 'Member Left Group',
    PRICE_CHANGED: 'Price Updated',
    GROUP_CONFIRMED: 'Ride Confirmed'
  };
  return titles[type as keyof typeof titles] || 'Group Update';
}

function getNotificationMessage(type: string, group: any): string {
  const messages = {
    MEMBER_ADDED: `A new passenger joined your ride group. Current: ${group.currentCapacity} passengers`,
    MEMBER_REMOVED: `A passenger left your ride group. Current: ${group.currentCapacity} passengers`,
    PRICE_CHANGED: `Your ride price has been updated to €${group.members[0]?.totalPrice || 0}`,
    GROUP_CONFIRMED: `Your shared ride is confirmed! ${group.currentCapacity} passengers total`
  };
  return messages[type as keyof typeof messages] || 'Your ride group has been updated';
}

/**
 * Valida che i bookings appartengano allo stesso volo
 */
export async function validateSameFlightBookings(bookingIds: string[]): Promise<boolean> {
  const bookings = await prisma.booking.findMany({
    where: { id: { in: bookingIds } },
    select: { flightNumber: true }
  });
  
  if (bookings.length !== bookingIds.length) {
    return false;
  }
  
  const flightNumbers = new Set(bookings.map(b => b.flightNumber));
  return flightNumbers.size === 1;
}

/**
 * Calcola il totale passeggeri contando i micro-groups correttamente
 */
export async function calculateTotalPaxWithMicroGroups(
  existingMembers: any[],
  newBookingId?: string
): Promise<number> {
  let total = existingMembers.reduce((sum, member) => {
    // Se il membro fa parte di un micro-group, conta i pax del micro-group
    return sum + (member.microGroup?.totalPassengers || 1);
  }, 0);
  
  if (newBookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: newBookingId },
      include: { microGroup: true }
    });
    
    if (booking?.microGroup) {
      total += booking.microGroup.totalPassengers;
    } else {
      total += (booking?.passengers || 1);
    }
  }
  
  return total;
}