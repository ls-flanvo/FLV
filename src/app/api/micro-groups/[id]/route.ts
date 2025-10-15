// src/app/api/micro-groups/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/micro-groups/[id]
 * Recupera i dettagli di un micro-group specifico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log(`[MicroGroup] Fetching micro-group: ${id}`);
    
    // Recupera il micro-group con tutti i dettagli
    const microGroup = await prisma.microGroup.findUnique({
      where: { id },
      include: {
        leadUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        bookings: {
          select: {
            id: true,
            userId: true,
            passengers: true,
            pickupLocation: true,
            pickupLat: true,
            pickupLng: true,
            dropoffLocation: true,
            dropoffLat: true,
            dropoffLng: true,
            flightNumber: true,
            flightDate: true,
            flightTime: true,
            status: true,
            createdAt: true
          }
        },
        groupMembers: {
          include: {
            rideGroup: {
              select: {
                id: true,
                status: true,
                totalRouteKm: true,
                currentCapacity: true
              }
            }
          }
        }
      }
    });
    
    if (!microGroup) {
      return NextResponse.json(
        { error: 'Micro-group not found' },
        { status: 404 }
      );
    }
    
    // Formatta la risposta
    const response = {
      id: microGroup.id,
      leadUser: microGroup.leadUser,
      totalPassengers: microGroup.totalPassengers,
      totalLuggage: microGroup.totalLuggage,
      mustStayTogether: microGroup.mustStayTogether,
      isActive: microGroup.isActive,
      bookings: microGroup.bookings,
      rideGroup: microGroup.groupMembers.length > 0 
        ? {
            id: microGroup.groupMembers[0].rideGroup.id,
            status: microGroup.groupMembers[0].rideGroup.status,
            currentCapacity: microGroup.groupMembers[0].rideGroup.currentCapacity,
            totalRouteKm: microGroup.groupMembers[0].rideGroup.totalRouteKm
          }
        : null,
      createdAt: microGroup.createdAt,
      updatedAt: microGroup.updatedAt
    };
    
    console.log(`[MicroGroup] Found micro-group with ${microGroup.totalPassengers} passengers`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[MicroGroup] Error fetching micro-group:', error);
    
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
 * DELETE /api/micro-groups/[id]
 * Elimina un micro-group (solo se non è ancora in un RideGroup confermato)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log(`[MicroGroup] Deleting micro-group: ${id}`);
    
    // Verifica che il micro-group esista
    const microGroup = await prisma.microGroup.findUnique({
      where: { id },
      include: {
        groupMembers: {
          include: {
            rideGroup: true
          }
        }
      }
    });
    
    if (!microGroup) {
      return NextResponse.json(
        { error: 'Micro-group not found' },
        { status: 404 }
      );
    }
    
    // Valida che il micro-group non sia in un gruppo confermato
    const inConfirmedGroup = microGroup.groupMembers.some(
      member => member.rideGroup.status === 'CONFIRMED' || member.rideGroup.status === 'ACTIVE'
    );
    
    if (inConfirmedGroup) {
      return NextResponse.json(
        { error: 'Cannot delete micro-group that is in a confirmed ride group' },
        { status: 400 }
      );
    }
    
    // Elimina il micro-group in una transazione
    await prisma.$transaction(async (tx) => {
      // Rimuovi il riferimento dai bookings
      await tx.booking.updateMany({
        where: { microGroupId: id },
        data: { microGroupId: null }
      });
      
      // Elimina eventuali group members
      await tx.groupMember.deleteMany({
        where: { microGroupId: id }
      });
      
      // Elimina il micro-group
      await tx.microGroup.delete({
        where: { id }
      });
    });
    
    console.log(`[MicroGroup] Deleted micro-group ${id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Micro-group deleted successfully'
    });
    
  } catch (error) {
    console.error('[MicroGroup] Error deleting micro-group:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}