// src/app/api/groups/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/groups/[id]
 * Recupera i dettagli completi di un RideGroup
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log(`[RideGroup] Fetching group: ${id}`);
    
    // Recupera il gruppo con tutti i dettagli
    const rideGroup = await prisma.rideGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            booking: {
              select: {
                id: true,
                userId: true,
                passengers: true,
                pickupAddress: true,
                pickupLat: true,
                pickupLng: true,
                destinationAddress: true,
                destinationLat: true,
                destinationLng: true,
                flightNumber: true,
                flightDate: true,
                flightTime: true,
                status: true
              }
            },
            microGroup: {
              select: {
                id: true,
                name: true,
                totalPax: true
              }
            }
          },
          orderBy: { pickupOrder: 'asc' }
        },
        route: {
          orderBy: { sequence: 'asc' }
        }
      }
    });
    
    if (!rideGroup) {
      return NextResponse.json(
        { error: 'Ride group not found' },
        { status: 404 }
      );
    }
    
    // Formatta la risposta con breakdown dettagliato del pricing
    const response = {
      id: rideGroup.id,
      clusterId: rideGroup.clusterId,
      flightNumber: rideGroup.flightNumber,
      status: rideGroup.status,
      currentPax: rideGroup.currentPax,
      maxPax: rideGroup.maxPax,
      totalRouteKm: rideGroup.totalRouteKm,
      qualityScore: rideGroup.qualityScore,
      tier: rideGroup.tier,
      vehicleCost: rideGroup.vehicleCost,
      
      // Membri con pricing breakdown
      members: rideGroup.members.map(member => ({
        id: member.id,
        bookingId: member.bookingId,
        status: member.status,
        
        // Passenger info
        passenger: {
          userId: member.booking.userId,
          passengers: member.booking.passengers,
          pickup: {
            address: member.booking.pickupAddress,
            lat: member.booking.pickupLat,
            lng: member.booking.pickupLng,
            order: member.pickupOrder
          },
          dropoff: {
            address: member.booking.destinationAddress,
            lat: member.booking.destinationLat,
            lng: member.booking.destinationLng,
            order: member.dropoffOrder
          }
        },
        
        // MicroGroup info se presente
        microGroup: member.microGroup ? {
          id: member.microGroup.id,
          name: member.microGroup.name,
          totalPax: member.microGroup.totalPax
        } : null,
        
        // Distance info
        kmOnboard: member.kmOnboard,
        
        // Pricing breakdown EQUO
        pricing: {
          driverShare: member.driverShare,
          flanvoFee: member.flanvoFee,
          totalPrice: member.totalPrice,
          breakdown: {
            vehicleCostSplit: `€${member.driverShare} (split equally among ${rideGroup.currentPax} passengers)`,
            flanvoFee: `€${member.flanvoFee} (€${(member.flanvoFee / member.kmOnboard).toFixed(2)}/km × ${member.kmOnboard}km)`
          }
        },
        
        joinedAt: member.joinedAt
      })),
      
      // Rotta ottimizzata
      route: rideGroup.route.map(waypoint => ({
        sequence: waypoint.sequence,
        type: waypoint.type,
        location: {
          lat: waypoint.lat,
          lng: waypoint.lng,
          address: waypoint.address
        },
        memberId: waypoint.memberId,
        estimatedTime: waypoint.estimatedTime
      })),
      
      // Summary
      summary: {
        totalVehicleCost: rideGroup.vehicleCost,
        costPerPassenger: rideGroup.vehicleCost / rideGroup.currentPax,
        totalDistance: rideGroup.totalRouteKm,
        estimatedDuration: rideGroup.estimatedDuration,
        quality: {
          score: rideGroup.qualityScore,
          tier: rideGroup.tier
        }
      },
      
      createdAt: rideGroup.createdAt,
      updatedAt: rideGroup.updatedAt
    };
    
    console.log(`[RideGroup] Found group with ${rideGroup.currentPax} passengers`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[RideGroup] Error fetching group:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}