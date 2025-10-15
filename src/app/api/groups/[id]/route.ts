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
                pickupLocation: true,
                pickupLat: true,
                pickupLng: true,
                dropoffLocation: true,
                dropoffLat: true,
                dropoffLng: true,
                flightNumber: true,
                flightDate: true,
                flightTime: true,
                status: true
              }
            },
            microGroup: {
              select: {
                id: true,
                totalPassengers: true
              }
            }
          },
          orderBy: { pickupOrder: 'asc' }
        },
        routes: {
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
      flightNumber: rideGroup.flightNumber,
      direction: rideGroup.direction,
      status: rideGroup.status,
      currentCapacity: rideGroup.currentCapacity,
      maxCapacity: rideGroup.maxCapacity,
      currentLuggage: rideGroup.currentLuggage,
      totalRouteKm: rideGroup.totalRouteKm,
      totalDuration: rideGroup.totalDuration,
      qualityScore: rideGroup.qualityScore,
      stabilityTier: rideGroup.stabilityTier,
      basePrice: rideGroup.basePrice,
      
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
            address: member.booking.pickupLocation,
            latitude: member.booking.pickupLat,
            longitude: member.booking.pickupLng,
            order: member.pickupOrder
          },
          dropoff: {
            address: member.booking.dropoffLocation,
            latitude: member.booking.dropoffLat,
            longitude: member.booking.dropoffLng,
            order: member.dropoffOrder
          }
        },
        
        // MicroGroup info se presente
        microGroup: member.microGroup ? {
          id: member.microGroup.id,
          totalPassengers: member.microGroup.totalPassengers
        } : null,
        
        // Distance info
        kmOnboard: member.kmOnboard,
        kmDirect: member.kmDirect,
        detourKm: member.detourKm,
        detourPercent: member.detourPercent,
        
        // Pricing breakdown EQUO
        pricing: {
          driverShare: member.driverShare,
          flanvoFee: member.flanvoFee,
          totalPrice: member.totalPrice,
          breakdown: {
            vehicleCostSplit: `€${member.driverShare} (split equally among ${rideGroup.currentCapacity} passengers)`,
            flanvoFee: `€${member.flanvoFee} (€${member.kmOnboard ? (member.flanvoFee / member.kmOnboard).toFixed(2) : '0.00'}/km × ${member.kmOnboard || 0}km)`
          }
        },
        
        joinedAt: member.joinedAt
      })),
      
      // Rotta ottimizzata
      route: rideGroup.routes.map(waypoint => ({
        sequence: waypoint.sequence,
        type: waypoint.type,
        location: {
          latitude: waypoint.latitude,
          longitude: waypoint.longitude,
          address: waypoint.address
        },
        bookingId: waypoint.bookingId,
        estimatedArrival: waypoint.estimatedArrival,
        reached: waypoint.reached
      })),
      
      // Summary
      summary: {
        basePrice: rideGroup.basePrice,
        costPerPassenger: rideGroup.basePrice / rideGroup.currentCapacity,
        totalDistance: rideGroup.totalRouteKm,
        estimatedDuration: rideGroup.totalDuration,
        quality: {
          score: rideGroup.qualityScore,
          tier: rideGroup.stabilityTier
        }
      },
      
      createdAt: rideGroup.createdAt,
      updatedAt: rideGroup.updatedAt
    };
    
    console.log(`[RideGroup] Found group with ${rideGroup.currentCapacity} passengers`);
    
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