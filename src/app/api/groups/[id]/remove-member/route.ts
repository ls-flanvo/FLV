// src/app/api/groups/[id]/remove-member/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { 
  calculateEquoPricing, 
  recalculateGroupRoute, 
  notifyGroupMembers,
  calculateQualityScore,
  getGroupTier
} from '@/lib/group-helpers';

const prisma = new PrismaClient();

// Schema di validazione
const RemoveMemberSchema = z.object({
  memberId: z.string()
});

/**
 * DELETE /api/groups/[id]/remove-member
 * Rimuove un membro dal gruppo e ricalcola il pricing EQUO per i rimanenti
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: groupId } = params;
    const body = await request.json();
    
    // Valida l'input
    const validationResult = RemoveMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.flatten() 
        },
        { status: 400 }
      );
    }
    
    const { memberId } = validationResult.data;
    
    console.log(`[RideGroup] Removing member ${memberId} from group ${groupId}`);
    
    // Recupera il gruppo e il membro
    const group = await prisma.rideGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            booking: true,
            microGroup: {
              include: {
                bookings: true
              }
            }
          }
        }
      }
    });
    
    if (!group) {
      return NextResponse.json(
        { error: 'Ride group not found' },
        { status: 404 }
      );
    }
    
    // Trova il membro da rimuovere
    const memberToRemove = group.members.find(m => m.id === memberId);
    
    if (!memberToRemove) {
      return NextResponse.json(
        { error: 'Member not found in this group' },
        { status: 404 }
      );
    }
    
    // Valida che il gruppo non sia in fase di pagamento, confermato o in progress
    if (group.status === 'READY') {
      return NextResponse.json(
        { error: 'Cannot remove members: group is in payment phase (READY status). Contact Agent 4 for payment intent cancellation.' },
        { status: 400 }
      );
    }
    
    if (group.status === 'CONFIRMED' || group.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot remove members from a confirmed or in-progress group' },
        { status: 400 }
      );
    }
    
    // Determina quanti passeggeri saranno rimossi
    const paxToRemove = memberToRemove.microGroup 
      ? memberToRemove.microGroup.totalPassengers 
      : memberToRemove.booking.passengers;
    
    const luggageToRemove = memberToRemove.booking.luggage || 0;
    
    const remainingPax = group.currentCapacity - paxToRemove;
    const remainingLuggage = group.currentLuggage - luggageToRemove;
    
    console.log(`[RideGroup] Removing ${paxToRemove} passenger(s). Remaining: ${remainingPax}`);
    
    // Se il membro era parte di un micro-group, rimuovi TUTTI i membri del micro-group
    let memberIdsToRemove = [memberId];
    
    if (memberToRemove.microGroupId) {
      // Trova tutti i membri dello stesso micro-group
      memberIdsToRemove = group.members
        .filter(m => m.microGroupId === memberToRemove.microGroupId)
        .map(m => m.id);
      
      console.log(`[RideGroup] Member is part of micro-group. Removing ${memberIdsToRemove.length} members`);
    }
    
    // Se rimangono meno di 2 passeggeri, elimina il gruppo
    if (remainingPax < 2) {
      console.log(`[RideGroup] Less than 2 passengers remaining. Marking group as NO_MATCH.`);
      
      await prisma.$transaction(async (tx) => {
        // Elimina i membri
        await tx.groupMember.deleteMany({
          where: { rideGroupId: groupId }
        });
        
        // Elimina la rotta
        await tx.groupRoute.deleteMany({
          where: { rideGroupId: groupId }
        });
        
        // Segna il gruppo come NO_MATCH
        await tx.rideGroup.update({
          where: { id: groupId },
          data: { 
            status: 'NO_MATCH',
            currentCapacity: 0,
            currentLuggage: 0
          }
        });
      });
      
      return NextResponse.json({
        success: true,
        deleted: true,
        message: 'Group disbanded due to insufficient passengers'
      });
    }
    
    // Altrimenti, rimuovi il membro e ricalcola
    const remainingMembers = group.members.filter(
      m => !memberIdsToRemove.includes(m.id)
    );
    
    // Ricalcola il pricing EQUO per i membri rimanenti
    const newPricing = calculateEquoPricing(
      group.basePrice,
      remainingMembers.map(m => ({ kmOnboard: m.kmOnboard || 0 }))
    );
    
    // Aggiorna il gruppo in una transazione
    const updatedGroup = await prisma.$transaction(async (tx) => {
      // Rimuovi i membri
      await tx.groupMember.deleteMany({
        where: { 
          id: { in: memberIdsToRemove }
        }
      });
      
      // Aggiorna il pricing di TUTTI i membri rimanenti
      for (let i = 0; i < remainingMembers.length; i++) {
        await tx.groupMember.update({
          where: { id: remainingMembers[i].id },
          data: {
            driverShare: newPricing[i].driverShare,
            flanvoFee: newPricing[i].flanvoFee,
            totalPrice: newPricing[i].totalPrice
          }
        });
      }
      
      // Calcola nuovo quality score
      const totalKmOnboard = remainingMembers.reduce((sum, m) => sum + (m.kmOnboard || 0), 0);
      const newQualityScore = calculateQualityScore(
        remainingPax,
        group.totalRouteKm || 0,
        totalKmOnboard
      );
      
      const newStabilityTier = getGroupTier(newQualityScore);
      
      // Aggiorna il gruppo
      const updated = await tx.rideGroup.update({
        where: { id: groupId },
        data: {
          currentCapacity: remainingPax,
          currentLuggage: remainingLuggage,
          qualityScore: newQualityScore,
          stabilityTier: newStabilityTier,
          // Se solo 2 passeggeri rimangono con score basso, marca come NO_MATCH
          status: (remainingPax === 2 && newQualityScore < 70) ? 'NO_MATCH' : group.status
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
      
      return updated;
    });
    
    // Ricalcola la rotta ottimizzata (asincrono)
    recalculateGroupRoute(groupId).catch(err => {
      console.error('[RideGroup] Error recalculating route:', err);
    });
    
    // Notifica i membri rimanenti
    notifyGroupMembers(groupId, 'MEMBER_REMOVED').catch(err => {
      console.error('[RideGroup] Error sending notifications:', err);
    });
    
    console.log(`[RideGroup] Member removed successfully. New pricing calculated for ${remainingPax} passengers.`);
    
    // Formatta la risposta
    const response = {
      success: true,
      group: {
        id: updatedGroup.id,
        currentCapacity: updatedGroup.currentCapacity,
        qualityScore: updatedGroup.qualityScore,
        stabilityTier: updatedGroup.stabilityTier,
        status: updatedGroup.status,
        members: updatedGroup.members.map(member => ({
          id: member.id,
          bookingId: member.bookingId,
          microGroup: member.microGroup,
          kmOnboard: member.kmOnboard,
          pricing: {
            driverShare: member.driverShare,
            flanvoFee: member.flanvoFee,
            totalPrice: member.totalPrice
          }
        }))
      },
      message: `Removed ${paxToRemove} passenger(s). Pricing recalculated for ${remainingPax} remaining passengers.`
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[RideGroup] Error removing member:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}