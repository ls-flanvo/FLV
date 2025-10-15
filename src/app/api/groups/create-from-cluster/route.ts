// src/app/api/groups/create-from-cluster/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { 
  calculateEquoPricing, 
  calculateQualityScore, 
  getGroupTier 
} from '@/lib/group-helpers';

const prisma = new PrismaClient();

// Schema di validazione
const MemberSchema = z.object({
  bookingId: z.string(),
  destinationLat: z.number(),
  destinationLng: z.number(),
  kmOnboard: z.number().positive(),
  pickupOrder: z.number().int().min(0),
  dropoffOrder: z.number().int().min(0)
});

const RouteWaypointSchema = z.object({
  type: z.enum(['AIRPORT', 'PICKUP', 'DROPOFF']),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string(),
  sequence: z.number().int().min(0),
  bookingId: z.string().optional()
});

const CreateGroupSchema = z.object({
  flightNumber: z.string(),
  direction: z.enum(['TO_AIRPORT', 'FROM_AIRPORT']),
  targetPickupTime: z.string().datetime(),
  clusterData: z.object({
    totalPassengers: z.number().int().min(2).max(7),
    totalKm: z.number().positive(),
    members: z.array(MemberSchema).min(2).max(7),
    route: z.array(RouteWaypointSchema).min(3)
  })
});

/**
 * POST /api/groups/create-from-cluster
 * Crea un RideGroup da un cluster DBSCAN con pricing EQUO
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Valida l'input
    const validationResult = CreateGroupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.flatten() 
        },
        { status: 400 }
      );
    }
    
    const { flightNumber, direction, targetPickupTime, clusterData } = validationResult.data;
    
    console.log(`[RideGroup] Creating group for flight ${flightNumber}`);
    
    // Valida che i bookings esistano
    const bookingIds = clusterData.members.map(m => m.bookingId);
    const bookings = await prisma.booking.findMany({
      where: { 
        id: { in: bookingIds },
        flightNumber 
      },
      include: {
        microGroup: true
      }
    });
    
    if (bookings.length !== bookingIds.length) {
      return NextResponse.json(
        { error: 'One or more bookings not found or flight number mismatch' },
        { status: 404 }
      );
    }
    
    // Calcola il costo base del veicolo (esempio: €100 base + €0.50/km)
    // TODO: Implementare logica reale di pricing del veicolo
    const baseCost = 100;
    const costPerKm = 0.50;
    const basePrice = baseCost + (clusterData.totalKm * costPerKm);
    
    // Calcola pricing EQUO per tutti i membri
    const pricingData = calculateEquoPricing(
      basePrice,
      clusterData.members
    );
    
    // Calcola quality score
    const directKmSum = clusterData.members.reduce((sum, m) => sum + m.kmOnboard, 0);
    const qualityScore = calculateQualityScore(
      clusterData.totalPassengers,
      clusterData.totalKm,
      directKmSum
    );
    
    const stabilityTier = getGroupTier(qualityScore);
    
    // Calcola totale bagagli
    const totalLuggage = bookings.reduce((sum, b) => sum + (b.luggage || 0), 0);
    
    console.log(`[RideGroup] Calculated pricing - Base price: €${basePrice}, Quality: ${qualityScore} (${stabilityTier})`);
    
    // Crea il RideGroup in una transazione
    const rideGroup = await prisma.$transaction(async (tx) => {
      // Crea il RideGroup
      const group = await tx.rideGroup.create({
        data: {
          flightNumber,
          direction,
          targetPickupTime: new Date(targetPickupTime),
          clusterMethod: 'DBSCAN',
          maxCapacity: 7,
          currentCapacity: clusterData.totalPassengers,
          currentLuggage: totalLuggage,
          totalRouteKm: clusterData.totalKm,
          qualityScore,
          stabilityTier,
          basePrice,
          status: 'FORMING',
          // Crea i membri
          members: {
            create: clusterData.members.map((member, idx) => ({
              bookingId: member.bookingId,
              microGroupId: bookings.find(b => b.id === member.bookingId)?.microGroupId || null,
              kmOnboard: member.kmOnboard,
              driverShare: pricingData[idx].driverShare,
              flanvoFee: pricingData[idx].flanvoFee,
              totalPrice: pricingData[idx].totalPrice,
              pickupOrder: member.pickupOrder,
              dropoffOrder: member.dropoffOrder,
              status: 'PENDING'
            }))
          },
          // Crea la rotta
          routes: {
            create: clusterData.route.map(waypoint => ({
              sequence: waypoint.sequence,
              type: waypoint.type,
              latitude: waypoint.latitude,
              longitude: waypoint.longitude,
              address: waypoint.address,
              bookingId: waypoint.bookingId || null,
              estimatedArrival: new Date() // TODO: calcolare timing reali
            }))
          }
        },
        include: {
          members: {
            include: {
              booking: {
                select: {
                  id: true,
                  userId: true,
                  passengers: true,
                  pickupLocation: true,
                  dropoffLocation: true
                }
              },
              microGroup: {
                select: {
                  id: true,
                  totalPassengers: true
                }
              }
            }
          },
          routes: {
            orderBy: { sequence: 'asc' }
          }
        }
      });
      
      return group;
    });
    
    console.log(`[RideGroup] Created group ${rideGroup.id} with ${rideGroup.currentCapacity} passengers`);
    
    // Formatta la risposta
    const response = {
      success: true,
      group: {
        id: rideGroup.id,
        flightNumber: rideGroup.flightNumber,
        direction: rideGroup.direction,
        status: rideGroup.status,
        currentCapacity: rideGroup.currentCapacity,
        maxCapacity: rideGroup.maxCapacity,
        totalRouteKm: rideGroup.totalRouteKm,
        qualityScore: rideGroup.qualityScore,
        stabilityTier: rideGroup.stabilityTier,
        basePrice: rideGroup.basePrice,
        members: rideGroup.members.map(member => ({
          id: member.id,
          bookingId: member.bookingId,
          microGroup: member.microGroup,
          kmOnboard: member.kmOnboard,
          pricing: {
            driverShare: member.driverShare,
            flanvoFee: member.flanvoFee,
            totalPrice: member.totalPrice
          },
          pickupOrder: member.pickupOrder,
          dropoffOrder: member.dropoffOrder,
          status: member.status,
          booking: member.booking
        })),
        route: rideGroup.routes,
        createdAt: rideGroup.createdAt
      }
    };
    
    return NextResponse.json(response, { status: 201 });
    
  } catch (error) {
    console.error('[RideGroup] Error creating group from cluster:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}