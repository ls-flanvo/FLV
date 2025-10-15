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
  lat: z.number(),
  lng: z.number(),
  address: z.string(),
  sequence: z.number().int().min(0),
  memberId: z.string().optional()
});

const CreateGroupSchema = z.object({
  clusterId: z.string(),
  flightNumber: z.string(),
  clusterData: z.object({
    totalPax: z.number().int().min(2).max(7),
    totalKm: z.number().positive(),
    members: z.array(MemberSchema).min(2).max(7),
    route: z.array(RouteWaypointSchema).min(3) // Almeno AIRPORT + 1 PICKUP + 1 DROPOFF
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
    
    const { clusterId, flightNumber, clusterData } = validationResult.data;
    
    console.log(`[RideGroup] Creating group from cluster ${clusterId} for flight ${flightNumber}`);
    
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
    
    // Calcola il costo totale del veicolo (esempio: €100 base + €0.50/km)
    // TODO: Implementare logica reale di pricing del veicolo
    const baseCost = 100;
    const costPerKm = 0.50;
    const totalVehicleCost = baseCost + (clusterData.totalKm * costPerKm);
    
    // Calcola pricing EQUO per tutti i membri
    const pricingData = calculateEquoPricing(
      totalVehicleCost,
      clusterData.members
    );
    
    // Calcola quality score
    const directKmSum = clusterData.members.reduce((sum, m) => sum + m.kmOnboard, 0);
    const qualityScore = calculateQualityScore(
      clusterData.totalPax,
      clusterData.totalKm,
      directKmSum
    );
    
    const tier = getGroupTier(qualityScore);
    
    console.log(`[RideGroup] Calculated pricing - Vehicle cost: €${totalVehicleCost}, Quality: ${qualityScore} (${tier})`);
    
    // Crea il RideGroup in una transazione
    const rideGroup = await prisma.$transaction(async (tx) => {
      // Crea il RideGroup
      const group = await tx.rideGroup.create({
        data: {
          clusterId,
          flightNumber,
          totalRouteKm: clusterData.totalKm,
          currentPax: clusterData.totalPax,
          maxPax: 7,
          status: 'FORMING',
          qualityScore,
          tier,
          vehicleCost: totalVehicleCost,
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
          route: {
            create: clusterData.route.map(waypoint => ({
              sequence: waypoint.sequence,
              type: waypoint.type,
              lat: waypoint.lat,
              lng: waypoint.lng,
              address: waypoint.address,
              memberId: waypoint.memberId || null
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
                  pickupAddress: true,
                  destinationAddress: true
                }
              },
              microGroup: {
                select: {
                  id: true,
                  name: true,
                  totalPax: true
                }
              }
            }
          },
          route: {
            orderBy: { sequence: 'asc' }
          }
        }
      });
      
      return group;
    });
    
    console.log(`[RideGroup] Created group ${rideGroup.id} with ${rideGroup.currentPax} passengers`);
    
    // Formatta la risposta
    const response = {
      success: true,
      group: {
        id: rideGroup.id,
        flightNumber: rideGroup.flightNumber,
        status: rideGroup.status,
        currentPax: rideGroup.currentPax,
        maxPax: rideGroup.maxPax,
        totalRouteKm: rideGroup.totalRouteKm,
        qualityScore: rideGroup.qualityScore,
        tier: rideGroup.tier,
        vehicleCost: rideGroup.vehicleCost,
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
        route: rideGroup.route,
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