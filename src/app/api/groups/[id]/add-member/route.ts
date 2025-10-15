// src/app/api/groups/[id]/add-member/route.ts
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
const AddMemberSchema = z.object({
  bookingId: z.string(),
  kmOnboard: z.number().positive(),
  pickupOrder: z.number().int().min(0).optional(),
  dropoffOrder: z.number().int().min(0).optional()
});

/**
 * POST /api/groups/[id]/add-member
 * Aggiunge un nuovo membro al gruppo e ricalcola il pricing EQUO per tutti
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: groupId } = params;
    const body = await request.json();
    
    // Valida l'input
    const validationResult = AddMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.flatten() 
        },
        { status: 400 }
      );
    }
    
    const { bookingId, kmOnboard, pickupOrder, dropoffOrder } = validationResult.data;
    
    console.log(`[RideGroup] Adding member ${bookingId} to group ${groupId}`);
    
    // Recupera il gruppo corrente
    const group = await prisma.rideGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            booking: true,
            microGroup: true
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
    
    // Valida che il gruppo non sia già confermato
    if (group.status === 'CONFIRMED' || group.status === 'IN_PROGRESS' || group.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot add members to a confirmed or completed group' },
        { status: 400 }
      );
    }
    
    // Recupera il booking da aggiungere
    const newBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { microGroup: true }
    });
    
    if (!newBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Valida che il booking sia per lo stesso volo
    if (newBooking.flightNumber !== group.flightNumber) {
      return NextResponse.json(
        { error: 'Booking is for a different flight' },
        { status: 400 }
      );
    }
    
    // Valida che il booking non sia già in un gruppo
    const existingMember = await prisma.groupMember.findFirst({
      where: { bookingId }
    });
    
    if (existingMember) {
      return NextResponse.json(
        { error: 'Booking is already in a ride group' },
        { status: 400 }
      );
    }
    
    // Calcola i nuovi passeggeri totali
    const newPaxCount = newBooking.microGroup 
      ? newBooking.microGroup.totalPax 
      : newBooking.passengers;
    
    const totalPaxAfterAdd = group.currentPax + newPaxCount;
    
    // Valida capacity
    if (totalPaxAfterAdd > 7) {
      return NextResponse.json(
        { error: `Cannot add ${newPaxCount} passengers. Would exceed maximum capacity of 7 (current: ${group.currentPax})` },
        { status: 400 }
      );
    }
    
    console.log(`[RideGroup] Adding ${newPaxCount} passengers. New total: ${totalPaxAfterAdd}`);
    
    // Ricalcola il pricing EQUO per TUTTI i membri
    const allMembers = [
      ...group.members.map(m => ({ kmOnboard: m.kmOnboard })),
      { kmOnboard }
    ];
    
    const newPricing = calculateEquoPricing(group.vehicleCost, allMembers);
    
    // Aggiorna il gruppo in una transazione
    const updatedGroup = await prisma.$transaction(async (tx) => {
      // Aggiungi il nuovo membro
      const newMember = await tx.groupMember.create({
        data: {
          rideGroupId: groupId,
          bookingId,
          microGroupId: newBooking.microGroupId,
          kmOnboard,
          driverShare: newPricing[newPricing.length - 1].driverShare,
          flanvoFee: newPricing[newPricing.length - 1].flanvoFee,
          totalPrice: newPricing[newPricing.length - 1].totalPrice,
          pickupOrder: pickupOrder ?? group.members.length + 1,
          dropoffOrder: dropoffOrder ?? group.members.length + 1,
          status: 'PENDING'
        }
      });
      
      // Aggiorna il pricing di TUTTI i membri esistenti
      for (let i = 0; i < group.members.length; i++) {
        await tx.groupMember.update({
          where: { id: group.members[i].id },
          data: {
            driverShare: newPricing[i].driverShare,
            flanvoFee: newPricing[i].flanvoFee,
            totalPrice: newPricing[i].totalPrice
          }
        });
      }
      
      // Calcola nuovo quality score
      const totalKmOnboard = allMembers.reduce((sum, m) => sum + m.kmOnboard, 0);
      const newQualityScore = calculateQualityScore(
        totalPaxAfterAdd,
        group.totalRouteKm,
        totalKmOnboard
      );
      
      const newTier = getGroupTier(newQualityScore);
      
      // Aggiorna il gruppo
      const updated = await tx.rideGroup.update({
        where: { id: groupId },
        data: {
          currentPax: totalPaxAfterAdd,
          qualityScore: newQualityScore,
          tier: newTier
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
      
      return updated;
    });
    
    // Ricalcola la rotta ottimizzata (asincrono, non blocca la risposta)
    recalculateGroupRoute(groupId).catch(err => {
      console.error('[RideGroup] Error recalculating route:', err);
    });
    
    // Notifica i membri esistenti
    notifyGroupMembers(groupId, 'MEMBER_ADDED').catch(err => {
      console.error('[RideGroup] Error sending notifications:', err);
    });
    
    console.log(`[RideGroup] Member added successfully. New pricing calculated for all members.`);
    
    // Formatta la risposta
    const response = {
      success: true,
      group: {
        id: updatedGroup.id,
        currentPax: updatedGroup.currentPax,
        qualityScore: updatedGroup.qualityScore,
        tier: updatedGroup.tier,
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
      message: `Added ${newPaxCount} passenger(s). Pricing recalculated for all ${totalPaxAfterAdd} passengers.`
    };
    
    return NextResponse.json(response, { status: 201 });
    
  } catch (error) {
    console.error('[RideGroup] Error adding member:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}