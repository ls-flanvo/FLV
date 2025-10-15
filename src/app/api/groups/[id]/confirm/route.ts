// src/app/api/groups/[id]/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  validateGroupForConfirmation, 
  notifyGroupMembers 
} from '@/lib/group-helpers';

const prisma = new PrismaClient();

/**
 * PATCH /api/groups/[id]/confirm
 * Conferma un RideGroup dopo la validazione di tutti i requisiti
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: groupId } = params;
    
    console.log(`[RideGroup] Confirming group: ${groupId}`);
    
    // Recupera il gruppo con tutti i dettagli
    const group = await prisma.rideGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            booking: true,
            microGroup: true
          }
        },
        route: {
          orderBy: { sequence: 'asc' }
        }
      }
    });
    
    if (!group) {
      return NextResponse.json(
        { error: 'Ride group not found' },
        { status: 404 }
      );
    }
    
    // Valida che il gruppo sia nello stato corretto
    if (group.status === 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Group is already confirmed' },
        { status: 400 }
      );
    }
    
    if (group.status === 'NO_MATCH' || group.status === 'CANCELLED') {
      return NextResponse.json(
        { error: `Cannot confirm group with status: ${group.status}` },
        { status: 400 }
      );
    }
    
    // Valida che tutti i membri abbiano confermato
    const allMembersConfirmed = group.members.every(
      member => member.status === 'CONFIRMED'
    );
    
    // Valida il gruppo per la conferma
    const validation = validateGroupForConfirmation(
      group.currentPax,
      group.qualityScore,
      allMembersConfirmed
    );
    
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Group cannot be confirmed',
          reason: validation.reason
        },
        { status: 400 }
      );
    }
    
    console.log(`[RideGroup] All validations passed. Confirming group with ${group.currentPax} passengers.`);
    
    // Conferma il gruppo in una transazione
    const confirmedGroup = await prisma.$transaction(async (tx) => {
      // Aggiorna lo stato del gruppo: FORMING → READY → CONFIRMED
      const updated = await tx.rideGroup.update({
        where: { id: groupId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date()
        },
        include: {
          members: {
            include: {
              booking: true,
              microGroup: true
            }
          },
          route: {
            orderBy: { sequence: 'asc' }
          }
        }
      });
      
      // Aggiorna lo stato di tutti i bookings associati
      const bookingIds = updated.members.map(m => m.bookingId);
      await tx.booking.updateMany({
        where: {
          id: { in: bookingIds }
        },
        data: {
          status: 'CONFIRMED'
        }
      });
      
      // TODO: Trigger pre-auth payments
      // Questa logica sarà gestita da AGENT 4 (Payment Management)
      // Per ora creiamo un placeholder per il tracking
      console.log(`[RideGroup] Payment pre-authorization needed for group ${groupId}`);
      
      return updated;
    });
    
    // Notifica tutti i membri della conferma
    notifyGroupMembers(groupId, 'GROUP_CONFIRMED').catch(err => {
      console.error('[RideGroup] Error sending confirmation notifications:', err);
    });
    
    // TODO: Notifica anche il driver assegnato
    // Questa logica richiede l'integrazione con il sistema di driver assignment
    
    console.log(`[RideGroup] Group ${groupId} confirmed successfully`);
    
    // Formatta la risposta
    const response = {
      success: true,
      confirmed: true,
      group: {
        id: confirmedGroup.id,
        status: confirmedGroup.status,
        flightNumber: confirmedGroup.flightNumber,
        currentPax: confirmedGroup.currentPax,
        totalRouteKm: confirmedGroup.totalRouteKm,
        qualityScore: confirmedGroup.qualityScore,
        tier: confirmedGroup.tier,
        vehicleCost: confirmedGroup.vehicleCost,
        
        members: confirmedGroup.members.map(member => ({
          id: member.id,
          bookingId: member.bookingId,
          status: member.status,
          passenger: {
            userId: member.booking.userId,
            passengers: member.booking.passengers,
            pickup: member.booking.pickupAddress,
            dropoff: member.booking.destinationAddress
          },
          microGroup: member.microGroup ? {
            id: member.microGroup.id,
            name: member.microGroup.name,
            totalPax: member.microGroup.totalPax
          } : null,
          pricing: {
            driverShare: member.driverShare,
            flanvoFee: member.flanvoFee,
            totalPrice: member.totalPrice
          }
        })),
        
        route: confirmedGroup.route.map(waypoint => ({
          sequence: waypoint.sequence,
          type: waypoint.type,
          lat: waypoint.lat,
          lng: waypoint.lng,
          address: waypoint.address
        })),
        
        confirmedAt: confirmedGroup.confirmedAt,
        createdAt: confirmedGroup.createdAt
      },
      
      nextSteps: [
        'Payment pre-authorization will be processed',
        'Driver will be notified and assigned',
        'Passengers will receive confirmation details',
        'Real-time tracking will be available 1 hour before pickup'
      ]
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[RideGroup] Error confirming group:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/groups/[id]/confirm
 * Verifica se il gruppo può essere confermato senza effettuare la conferma
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: groupId } = params;
    
    const group = await prisma.rideGroup.findUnique({
      where: { id: groupId },
      include: {
        members: true
      }
    });
    
    if (!group) {
      return NextResponse.json(
        { error: 'Ride group not found' },
        { status: 404 }
      );
    }
    
    const allMembersConfirmed = group.members.every(
      member => member.status === 'CONFIRMED'
    );
    
    const validation = validateGroupForConfirmation(
      group.currentPax,
      group.qualityScore,
      allMembersConfirmed
    );
    
    return NextResponse.json({
      canConfirm: validation.valid,
      reason: validation.reason,
      checks: {
        status: group.status,
        currentPax: group.currentPax,
        minPaxMet: group.currentPax >= 2,
        qualityScore: group.qualityScore,
        qualityScoreMet: group.currentPax > 2 || group.qualityScore >= 70,
        allMembersConfirmed,
        membersConfirmedCount: group.members.filter(m => m.status === 'CONFIRMED').length,
        totalMembers: group.members.length
      }
    });
    
  } catch (error) {
    console.error('[RideGroup] Error checking confirmation status:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}