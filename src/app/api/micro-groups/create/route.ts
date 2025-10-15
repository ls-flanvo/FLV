// src/app/api/micro-groups/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validateSameFlightBookings } from '@/lib/group-helpers';

const prisma = new PrismaClient();

// Schema di validazione per la creazione di un micro-group
const CreateMicroGroupSchema = z.object({
  bookingIds: z.array(z.string()).min(2).max(3, 'Micro-groups can have maximum 3 people'),
  name: z.string().optional()
});

/**
 * POST /api/micro-groups/create
 * Crea un nuovo micro-group per 2-3 persone che prenotano insieme
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Valida l'input
    const validationResult = CreateMicroGroupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.flatten() 
        },
        { status: 400 }
      );
    }
    
    const { bookingIds, name } = validationResult.data;
    
    console.log(`[MicroGroup] Creating micro-group for bookings: ${bookingIds.join(', ')}`);
    
    // Recupera i bookings
    const bookings = await prisma.booking.findMany({
      where: { 
        id: { in: bookingIds }
      }
    });
    
    // Valida che tutti i bookings esistano
    if (bookings.length !== bookingIds.length) {
      return NextResponse.json(
        { error: 'One or more bookings not found' },
        { status: 404 }
      );
    }
    
    // Valida che i bookings non siano già in un micro-group
    const alreadyInMicroGroup = bookings.some(b => b.microGroupId !== null);
    if (alreadyInMicroGroup) {
      return NextResponse.json(
        { error: 'One or more bookings are already in a micro-group' },
        { status: 400 }
      );
    }
    
    // Valida che tutti i bookings siano per lo stesso volo
    const sameFlightNumbers = new Set(bookings.map(b => b.flightNumber));
    if (sameFlightNumbers.size > 1) {
      return NextResponse.json(
        { error: 'All bookings must be for the same flight' },
        { status: 400 }
      );
    }
    
    // Calcola il totale passeggeri
    const totalPax = bookings.reduce((sum, booking) => sum + booking.passengers, 0);
    
    if (totalPax > 3) {
      return NextResponse.json(
        { error: `Total passengers (${totalPax}) exceeds micro-group limit of 3` },
        { status: 400 }
      );
    }
    
    // Crea il micro-group in una transazione
    const microGroup = await prisma.$transaction(async (tx) => {
      // Crea il micro-group
      const newMicroGroup = await tx.microGroup.create({
        data: {
          name: name || `Group of ${bookings.length}`,
          totalPax,
          flightNumber: bookings[0].flightNumber,
          status: 'ACTIVE'
        }
      });
      
      // Collega tutti i bookings al micro-group
      await tx.booking.updateMany({
        where: {
          id: { in: bookingIds }
        },
        data: {
          microGroupId: newMicroGroup.id
        }
      });
      
      // Recupera il micro-group con i bookings
      return await tx.microGroup.findUnique({
        where: { id: newMicroGroup.id },
        include: {
          bookings: {
            select: {
              id: true,
              userId: true,
              passengers: true,
              pickupAddress: true,
              destinationAddress: true,
              flightNumber: true
            }
          }
        }
      });
    });
    
    console.log(`[MicroGroup] Created micro-group ${microGroup?.id} with ${totalPax} passengers`);
    
    return NextResponse.json({
      success: true,
      microGroup: {
        id: microGroup?.id,
        name: microGroup?.name,
        totalPax: microGroup?.totalPax,
        flightNumber: microGroup?.flightNumber,
        bookings: microGroup?.bookings,
        createdAt: microGroup?.createdAt
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('[MicroGroup] Error creating micro-group:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}