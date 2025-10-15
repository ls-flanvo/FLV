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
  const totalPax = members.length;
  
  if (totalPax === 0) {
    return [];
  }
  
  // Driver cost diviso equamente tra tutti
  const driverSharePerPax = totalVehicleCost / totalPax;
  
  return members.map(member => {
    const flanvoRate = getFlanvoRate(member.kmOnboard);
    const flanvoFee = member.kmOnboard * flanvoRate;
    
    return {
      driverShare: Math.round(driverSharePerPax * 100) / 100, // Arrotonda a 2 decimali
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
  totalPax: number,
  totalRouteKm: number,
  directKmSum: number
): number {
  // Base score per numero passeggeri (più pax = meglio)
  const paxScore = Math.min(100, (totalPax / 7) * 50);
  
  // Efficiency score (meno deviazione = meglio)
  const efficiency = directKmSum > 0 ? (directKmSum / totalRouteKm) : 0;
  const efficiencyScore = efficiency * 50;
  
  return Math.round(Math.min(100, paxScore + efficiencyScore));
}

/**
 * Determina il tier del gruppo basato sul quality score
 */
export function getGroupTier(qualityScore: number): 'GOLD' | 'SILVER' | 'BRONZE' {
  if (qualityScore >= 85) return 'GOLD';
  if (qualityScore >= 70) return 'SILVER';
  return 'BRONZE';
}

/**
 * Valida che un gruppo possa essere confermato
 */
export function validateGroupForConfirmation(
  totalPax: number,
  qualityScore: number,
  allMembersConfirmed: boolean
): { valid: boolean; reason?: string } {
  if (!allMembersConfirmed) {
    return { valid: false, reason: 'Not all members have confirmed' };
  }
  
  if (totalPax < 2) {
    return { valid: false, reason: 'Minimum 2 passengers required' };
  }
  
  // Se sono solo 2 passeggeri, richiediamo quality score più alto
  if (totalPax === 2 && qualityScore < 70) {
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
    const waypoints = [
      {
        type: 'AIRPORT' as const,
        lat: group.members[0].booking.airportLat,
        lng: group.members[0].booking.airportLng,
        address: 'Airport',
        sequence: 0
      },
      ...group.members.flatMap((member, idx) => [
        {
          type: 'PICKUP' as const,
          lat: member.booking.pickupLat,
          lng: member.booking.pickupLng,
          address: member.booking.pickupAddress,
          memberId: member.id,
          sequence: idx + 1
        },
        {
          type: 'DROPOFF' as const,
          lat: member.booking.destinationLat,
          lng: member.booking.destinationLng,
          address: member.booking.destinationAddress,
          memberId: member.id,
          sequence: group.members.length + idx + 1
        }
      ])
    ];
    
    // TODO: Implementare chiamata a Mapbox Optimization API
    // Per ora restituiamo i waypoints ordinati come sono
    // In produzione: chiamare Mapbox per ottimizzare l'ordine
    
    // Elimina i waypoints esistenti
    await prisma.groupRoute.deleteMany({
      where: { groupId }
    });
    
    // Crea i nuovi waypoints ottimizzati
    await prisma.groupRoute.createMany({
      data: waypoints.map((wp, idx) => ({
        groupId,
        sequence: idx,
        type: wp.type,
        lat: wp.lat,
        lng: wp.lng,
        address: wp.address,
        memberId: wp.memberId || null
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
    // Non lanciare l'errore - le notifiche sono non-critiche
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
    MEMBER_ADDED: `A new passenger joined your ride group. Current: ${group.currentPax} passengers`,
    MEMBER_REMOVED: `A passenger left your ride group. Current: ${group.currentPax} passengers`,
    PRICE_CHANGED: `Your ride price has been updated to €${group.members[0]?.totalPrice || 0}`,
    GROUP_CONFIRMED: `Your shared ride is confirmed! ${group.currentPax} passengers total`
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
    return sum + (member.microGroup?.totalPax || 1);
  }, 0);
  
  if (newBookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: newBookingId },
      include: { microGroup: true }
    });
    
    if (booking?.microGroup) {
      total += booking.microGroup.totalPax;
    } else {
      total += (booking?.passengers || 1);
    }
  }
  
  return total;
}