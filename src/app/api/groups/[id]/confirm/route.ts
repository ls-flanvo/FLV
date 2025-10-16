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
        routes: {
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
    if (group.status === 'READY') {
      return NextResponse.json(
        { error: 'Group is already in READY status, awaiting payment authorizations' },
        { status: 400 }
      );
    }
    
    if (group.status === 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Group is already confirmed (all payments authorized)' },
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
      group.currentCapacity,
      group.qualityScore || 0,
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
    
    console.log(`[RideGroup] All validations passed. Setting group to READY status with ${group.currentCapacity} passengers.`);
    
    // Prepara il gruppo per i pagamenti in una transazione
    const readyGroup = await prisma.$transaction(async (tx) => {
      // Aggiorna lo stato del gruppo: FORMING → READY (Agent 4 cambierà a CONFIRMED dopo i pagamenti)
      const updated = await tx.rideGroup.update({
        where: { id: groupId },
        data: {
          status: 'READY',
          matchConfirmTime: new Date()
        },
        include: {
          members: {
            include: {
              booking: true,
              microGroup: true
            }
          },
          routes: {
            orderBy: { sequence: 'asc' }
          }
        }
      });
      
      // Aggiorna lo stato di tutti i bookings associati a READY
      const bookingIds = updated.members.map(m => m.bookingId);
      await tx.booking.updateMany({
        where: {
          id: { in: bookingIds }
        },
        data: {
          status: 'IN_MATCHING'
        }
      });
      
      // TODO: Trigger payment intent creation (Agent 4)
      // Agent 4 creerà Payment Intents per ogni membro
      // Dopo authorization di tutti → Agent 4 cambierà status a CONFIRMED
      console.log(`[RideGroup] Payment intents creation needed for group ${groupId} (handled by Agent 4)`);
      
      return updated;
    });
    
    // Notifica tutti i membri che il gruppo è pronto per i pagamenti
    notifyGroupMembers(groupId, 'GROUP_CONFIRMED').catch(err => {
      console.error('[RideGroup] Error sending notifications:', err);
    });
    
    // TODO: Notifica Agent 4 per creare Payment Intents
    // Agent 4 manderà email ai passeggeri: "Conferma pagamento entro 10 minuti"
    
    console.log(`[RideGroup] Group ${groupId} set to READY status. Awaiting payment authorizations.`);
    
    // Formatta la risposta
    const response = {
      success: true,
      confirmed: false, // Non ancora confermato, solo READY
      ready: true,
      group: {
        id: readyGroup.id,
        status: readyGroup.status,
        flightNumber: readyGroup.flightNumber,
        direction: readyGroup.direction,
        currentCapacity: readyGroup.currentCapacity,
        totalRouteKm: readyGroup.totalRouteKm,
        qualityScore: readyGroup.qualityScore,
        stabilityTier: readyGroup.stabilityTier,
        basePrice: readyGroup.basePrice,
        
        members: readyGroup.members.map(member => ({
          id: member.id,
          bookingId: member.bookingId,
          status: member.status,
          passenger: {
            userId: member.booking.userId,
            passengers: member.booking.passengers,
            pickup: member.booking.pickupLocation,
            dropoff: member.booking.dropoffLocation
          },
          microGroup: member.microGroup ? {
            id: member.microGroup.id,
            totalPassengers: member.microGroup.totalPassengers
          } : null,
          pricing: {
            driverShare: member.driverShare,
            flanvoFee: member.flanvoFee,
            totalPrice: member.totalPrice
          }
        })),
        
        route: readyGroup.routes.map(waypoint => ({
          sequence: waypoint.sequence,
          type: waypoint.type,
          latitude: waypoint.latitude,
          longitude: waypoint.longitude,
          address: waypoint.address
        })),
        
        matchConfirmTime: readyGroup.matchConfirmTime,
        createdAt: readyGroup.createdAt
      },
      
      nextSteps: [
        'Payment Intents will be created for all passengers (Agent 4)',
        'Passengers will receive email to authorize payment within 10 minutes',
        'After all authorizations → Group status will change to CONFIRMED',
        'Driver will be assigned at T-15 (15 minutes before pickup)',
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
      group.currentCapacity,
      group.qualityScore || 0,
      allMembersConfirmed
    );
    
    return NextResponse.json({
      canConfirm: validation.valid,
      reason: validation.reason,
      currentStatus: group.status,
      checks: {
        status: group.status,
        statusExplanation: group.status === 'FORMING' 
          ? 'Group is being formed, can be set to READY' 
          : group.status === 'READY'
          ? 'Group is ready, awaiting payment authorizations from Agent 4'
          : group.status === 'CONFIRMED'
          ? 'Group is fully confirmed with all payments authorized'
          : 'Other status',
        currentCapacity: group.currentCapacity,
        minPaxMet: group.currentCapacity >= 2,
        qualityScore: group.qualityScore,
        qualityScoreMet: group.currentCapacity > 2 || (group.qualityScore || 0) >= 70,
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