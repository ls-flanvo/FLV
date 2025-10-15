/**
 * API Endpoint: Find Compatible Groups per Booking
 * POST /api/matching/find-groups
 * 
 * Trova gruppi compatibili per un booking specifico
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { dbscan, haversineDistance, type Point } from '@/lib/dbscan-clustering';
import { rankAndFilterPools, type PoolCandidate } from '@/lib/matching-algorithm';

const prisma = new PrismaClient();

interface FindGroupsRequest {
  bookingId: string;
  maxRadius?: number; // km, default 8.5
}

interface CompatibleGroup {
  groupId: string;
  clusterSize: number;
  centroid: { lat: number; lng: number };
  distanceFromBooking: number; // km
  bookings: Array<{
    bookingId: string;
    destination: { lat: number; lng: number };
    passengerName?: string;
  }>;
  compatibility: {
    withinRadius: boolean;
    estimatedDetour: number; // %
    potentialSavings: number; // %
    qualityScore?: number; // ✅ NUOVO: score dopo ranking
  };
}

interface FindGroupsResponse {
  success: boolean;
  bookingId: string;
  bookingDestination: { lat: number; lng: number };
  flightNumber: string;
  flightDate: string;
  availableGroups: CompatibleGroup[];
  createNewOption: {
    recommended: boolean;
    reason: string;
  };
  stats: {
    totalGroupsInFlight: number;
    compatibleGroups: number;
    bestGroupId?: string;
  };
  error?: string;
}

/**
 * Stima detour percentuale basato su distanza dal centroid
 */
function estimateDetour(distanceFromCentroid: number, directDistance: number): number {
  // Stima conservativa: detour proporzionale alla distanza dal centroid
  const detourKm = distanceFromCentroid * 0.5; // Assumo 50% della distanza come detour
  return (detourKm / directDistance) * 100;
}

/**
 * Stima saving basato su cluster size
 */
function estimateSavings(clusterSize: number): number {
  // Più grande il cluster, maggiore il risparmio
  if (clusterSize >= 4) return 40;
  if (clusterSize === 3) return 35;
  if (clusterSize === 2) return 25;
  return 0;
}

/**
 * POST /api/matching/find-groups
 * Trova gruppi esistenti compatibili per un booking
 */
export async function POST(request: NextRequest): Promise<NextResponse<FindGroupsResponse>> {
  try {
    const body: FindGroupsRequest = await request.json();
    const { bookingId, maxRadius = 8.5 } = body;

    if (!bookingId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: bookingId',
        bookingId: '',
        bookingDestination: { lat: 0, lng: 0 },
        flightNumber: '',
        flightDate: '',
        availableGroups: [],
        createNewOption: { recommended: false, reason: '' },
        stats: { totalGroupsInFlight: 0, compatibleGroups: 0 }
      }, { status: 400 });
    }

    console.log(`[FindGroups] Searching compatible groups for booking ${bookingId}`);

    // Recupera il booking target
    const targetBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        flightNumber: true,
        flightDate: true,
        destinationLat: true,
        destinationLng: true,
        passengerName: true,
        status: true
      }
    });

    if (!targetBooking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found',
        bookingId,
        bookingDestination: { lat: 0, lng: 0 },
        flightNumber: '',
        flightDate: '',
        availableGroups: [],
        createNewOption: { recommended: false, reason: '' },
        stats: { totalGroupsInFlight: 0, compatibleGroups: 0 }
      }, { status: 404 });
    }

    if (!targetBooking.destinationLat || !targetBooking.destinationLng) {
      return NextResponse.json({
        success: false,
        error: 'Booking has no destination coordinates',
        bookingId,
        bookingDestination: { lat: 0, lng: 0 },
        flightNumber: targetBooking.flightNumber,
        flightDate: targetBooking.flightDate.toISOString(),
        availableGroups: [],
        createNewOption: { recommended: false, reason: '' },
        stats: { totalGroupsInFlight: 0, compatibleGroups: 0 }
      }, { status: 400 });
    }

    const targetLat = targetBooking.destinationLat;
    const targetLng = targetBooking.destinationLng;

    // Query tutti gli altri bookings confermati dello stesso volo
    const otherBookings = await prisma.booking.findMany({
      where: {
        flightNumber: targetBooking.flightNumber,
        flightDate: targetBooking.flightDate,
        status: 'CONFIRMED',
        id: { not: bookingId },
        destinationLat: { not: null },
        destinationLng: { not: null }
      },
      select: {
        id: true,
        destinationLat: true,
        destinationLng: true,
        passengerName: true,
        poolGroupId: true // Campo per identificare gruppi esistenti
      }
    });

    console.log(`[FindGroups] Found ${otherBookings.length} other bookings on same flight`);

    if (otherBookings.length === 0) {
      return NextResponse.json({
        success: true,
        bookingId,
        bookingDestination: { lat: targetLat, lng: targetLng },
        flightNumber: targetBooking.flightNumber,
        flightDate: targetBooking.flightDate.toISOString(),
        availableGroups: [],
        createNewOption: {
          recommended: true,
          reason: 'No other bookings available - wait for more passengers'
        },
        stats: { totalGroupsInFlight: 0, compatibleGroups: 0 }
      });
    }

    // Converti in Points per clustering
    const points: Point[] = otherBookings.map(b => ({
      id: b.id,
      bookingId: b.id,
      lat: b.destinationLat!,
      lng: b.destinationLng!,
      metadata: {
        passengerName: b.passengerName,
        poolGroupId: b.poolGroupId
      }
    }));

    // Esegui DBSCAN per trovare cluster
    const dbscanResult = dbscan(points, maxRadius, 1); // minSamples=1 per trovare anche singoli vicini

    // Trova cluster compatibili (entro maxRadius dal target)
    let compatibleGroups: CompatibleGroup[] = [];

    for (const cluster of dbscanResult.clusters) {
      // Calcola distanza dal target al centroid del cluster
      const distanceFromTarget = haversineDistance(
        targetLat, targetLng,
        cluster.centroid.lat, cluster.centroid.lng
      );

      if (distanceFromTarget <= maxRadius) {
        // Cluster compatibile
        const directDistance = distanceFromTarget || 1; // Evita divisione per zero
        const estimatedDetourPercent = estimateDetour(distanceFromTarget, directDistance);
        const potentialSavingsPercent = estimateSavings(cluster.points.length + 1); // +1 per il target booking

        compatibleGroups.push({
          groupId: `cluster-${cluster.id}`,
          clusterSize: cluster.points.length,
          centroid: cluster.centroid,
          distanceFromBooking: Math.round(distanceFromTarget * 100) / 100,
          bookings: cluster.points.map(p => ({
            bookingId: p.bookingId,
            destination: { lat: p.lat, lng: p.lng },
            passengerName: p.metadata?.passengerName
          })),
          compatibility: {
            withinRadius: true,
            estimatedDetour: Math.round(estimatedDetourPercent * 10) / 10,
            potentialSavings: potentialSavingsPercent
          }
        });
      }
    }

    // Ordina per distanza (più vicini = migliori)
    compatibleGroups.sort((a, b) => a.distanceFromBooking - b.distanceFromBooking);

    console.log(`[FindGroups] Found ${compatibleGroups.length} compatible groups`);

    // ✅ APPLICA RANKING ALGORITHM ai gruppi compatibili
    if (compatibleGroups.length > 0) {
      // Converti CompatibleGroup in PoolCandidate per ranking
      const poolCandidates: PoolCandidate[] = compatibleGroups.map(g => {
        // Calcola metriche aggregate per il gruppo
        const avgDetour = g.compatibility.estimatedDetour;
        const avgExtraTime = (avgDetour / 100) * 60; // Stima tempo da detour
        
        // Mock passenger metrics (senza route optimization completa)
        const mockMetrics = g.bookings.map(b => ({
          bookingId: b.bookingId,
          kmOnboard: 50, // Stima media
          directDistance: 48,
          detourPercent: avgDetour,
          extraTimeMinutes: avgExtraTime,
          pickupIndex: 0,
          dropoffIndex: 0
        }));
        
        // Mock pricing (senza calcolo completo)
        const mockPricing = {
          totalRouteKm: 50 * g.clusterSize,
          totalDriverCost: 100 * g.clusterSize,
          totalFlanvoFee: 25 * g.clusterSize,
          grandTotal: 125 * g.clusterSize,
          passengers: g.bookings.map(b => ({
            bookingId: b.bookingId,
            kmOnboard: 50,
            driverCost: 100,
            flanvoFee: 25,
            totalPrice: 125,
            sharePercent: 100 / g.clusterSize,
            breakdown: {
              driverRate: 2.0,
              flanvoRate: 0.25,
              originalTotal: 125,
              pennyAdjustment: 0
            }
          })),
          validation: { sumMatchesTotal: true, difference: 0 }
        };
        
        return {
          clusterId: g.groupId,
          totalPax: g.clusterSize,
          totalRouteKm: 50 * g.clusterSize,
          totalDuration: 60 + avgExtraTime,
          maxDetourPercent: avgDetour,
          extraTimeMinutes: avgExtraTime,
          waypoints: g.clusterSize + 1,
          centroid: g.centroid,
          passengerMetrics: mockMetrics,
          pricing: mockPricing,
          bookingIds: g.bookings.map(b => b.bookingId)
        };
      });
      
      // Applica ranking
      const rankedResult = rankAndFilterPools(poolCandidates);
      
      console.log(`[FindGroups] After ranking: ${rankedResult.confirmablePools.length} confirmable, ${rankedResult.rejectedPools.length} rejected`);
      
      // Aggiorna compatibleGroups con risultati ranked
      const rankedGroups: CompatibleGroup[] = rankedResult.confirmablePools.map(pool => {
        const originalGroup = compatibleGroups.find(g => g.groupId === pool.clusterId)!;
        return {
          ...originalGroup,
          compatibility: {
            ...originalGroup.compatibility,
            qualityScore: pool.qualityScore || 0 // ✅ Aggiungi quality score
          }
        };
      });
      
      compatibleGroups = rankedGroups; // ✅ Usa solo i pool confermabili e ordinati
    }

    // Determina se creare nuovo gruppo
    const createNewRecommended = compatibleGroups.length === 0 ||
      (compatibleGroups.length > 0 && compatibleGroups[0].distanceFromBooking > maxRadius * 0.5);

    const createNewReason = compatibleGroups.length === 0
      ? 'No compatible groups within radius - wait for more passengers or adjust radius'
      : createNewRecommended
        ? 'Existing groups are far - consider waiting for closer matches'
        : 'Good matches available - joining existing group recommended';

    const response: FindGroupsResponse = {
      success: true,
      bookingId,
      bookingDestination: { lat: targetLat, lng: targetLng },
      flightNumber: targetBooking.flightNumber,
      flightDate: targetBooking.flightDate.toISOString(),
      availableGroups: compatibleGroups,
      createNewOption: {
        recommended: createNewRecommended,
        reason: createNewReason
      },
      stats: {
        totalGroupsInFlight: dbscanResult.clusters.length,
        compatibleGroups: compatibleGroups.length,
        bestGroupId: compatibleGroups.length > 0 ? compatibleGroups[0].groupId : undefined
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[FindGroups] Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      bookingId: '',
      bookingDestination: { lat: 0, lng: 0 },
      flightNumber: '',
      flightDate: '',
      availableGroups: [],
      createNewOption: { recommended: false, reason: '' },
      stats: { totalGroupsInFlight: 0, compatibleGroups: 0 }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/matching/find-groups
 * Health check e documentazione
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/matching/find-groups',
    method: 'POST',
    description: 'Find compatible groups for a specific booking',
    parameters: {
      required: ['bookingId'],
      optional: ['maxRadius (default: 8.5 km)']
    },
    example: {
      bookingId: 'clx123abc',
      maxRadius: 8.5
    }
  });
}