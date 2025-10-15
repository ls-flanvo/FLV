/**
 * API Endpoint: Rank Multiple Pools
 * POST /api/matching/rank-pools
 * 
 * Applica algoritmo di ranking a multipli pool per un volo
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { rankAndFilterPools, generateRankingReport, type PoolCandidate, type RankingResult } from '@/lib/matching-algorithm';

const prisma = new PrismaClient();

interface RankPoolsRequest {
  flightNumber: string;
  date: string;
  includeDetails?: boolean; // Se true, include dettagli completi dei pool
}

interface RankPoolsResponse {
  success: boolean;
  flightNumber: string;
  date: string;
  ranking: {
    confirmable: Array<{
      clusterId: string;
      totalPax: number;
      qualityScore: number;
      stabilityTier: string;
      recommendation: string;
      pricing: {
        grandTotal: number;
        avgPricePerPax: number;
      };
      metrics: {
        maxDetour: number;
        avgExtraTime: number;
        totalKm: number;
      };
    }>;
    rejected: Array<{
      clusterId: string;
      reason: string;
      violations: string[];
    }>;
  };
  stats: {
    totalCandidates: number;
    confirmable: number;
    rejected: number;
  };
  report?: string; // Report testuale se richiesto
  error?: string;
}

/**
 * POST /api/matching/rank-pools
 * Ranking di tutti i pool di un volo
 */
export async function POST(request: NextRequest): Promise<NextResponse<RankPoolsResponse>> {
  try {
    const body: RankPoolsRequest = await request.json();
    const { flightNumber, date, includeDetails = false } = body;

    if (!flightNumber || !date) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: flightNumber, date',
        flightNumber: flightNumber || '',
        date: date || '',
        ranking: { confirmable: [], rejected: [] },
        stats: { totalCandidates: 0, confirmable: 0, rejected: 0 }
      }, { status: 400 });
    }

    console.log(`[RankPools] Ranking pools for flight ${flightNumber} on ${date}`);

    // Query tutti i pool groups del volo dal database
    // Assumendo che i pool siano memorizzati con poolGroupId
    const poolGroups = await prisma.booking.groupBy({
      by: ['poolGroupId'],
      where: {
        flightNumber,
        flightDate: new Date(date),
        status: 'CONFIRMED',
        poolGroupId: { not: null }
      },
      _count: {
        id: true
      }
    });

    if (poolGroups.length === 0) {
      return NextResponse.json({
        success: true,
        flightNumber,
        date,
        ranking: { confirmable: [], rejected: [] },
        stats: { totalCandidates: 0, confirmable: 0, rejected: 0 }
      });
    }

    console.log(`[RankPools] Found ${poolGroups.length} pool groups`);

    // Costruisci PoolCandidate per ogni gruppo
    const poolCandidates: PoolCandidate[] = [];

    for (const group of poolGroups) {
      if (!group.poolGroupId) continue;

      // Query bookings del pool
      const poolBookings = await prisma.booking.findMany({
        where: {
          poolGroupId: group.poolGroupId,
          status: 'CONFIRMED'
        },
        select: {
          id: true,
          destinationLat: true,
          destinationLng: true,
          poolMetrics: true, // JSON field con metriche pre-calcolate
          poolPricing: true   // JSON field con pricing
        }
      });

      if (poolBookings.length < 2) continue; // Skip pool invalidi

      // Estrai metriche (assumendo siano state pre-calcolate)
      const firstBooking = poolBookings[0];
      const metrics = firstBooking.poolMetrics as any;
      const pricing = firstBooking.poolPricing as any;

      if (!metrics || !pricing) {
        console.warn(`[RankPools] Pool ${group.poolGroupId} missing metrics/pricing`);
        continue;
      }

      // Calcola centroid
      const centroid = {
        lat: poolBookings.reduce((sum, b) => sum + (b.destinationLat || 0), 0) / poolBookings.length,
        lng: poolBookings.reduce((sum, b) => sum + (b.destinationLng || 0), 0) / poolBookings.length
      };

      poolCandidates.push({
        clusterId: group.poolGroupId,
        totalPax: poolBookings.length,
        totalRouteKm: metrics.totalRouteKm || 0,
        totalDuration: metrics.totalDuration || 0,
        maxDetourPercent: metrics.maxDetourPercent || 0,
        extraTimeMinutes: metrics.avgExtraTimeMinutes || 0,
        waypoints: metrics.totalWaypoints || poolBookings.length + 1,
        centroid,
        passengerMetrics: metrics.passengerMetrics || [],
        pricing: pricing,
        bookingIds: poolBookings.map(b => b.id)
      });
    }

    console.log(`[RankPools] Built ${poolCandidates.length} pool candidates`);

    // Applica algoritmo di ranking
    const rankingResult = rankAndFilterPools(poolCandidates);

    // Formatta response
    const confirmableFormatted = rankingResult.confirmablePools.map(pool => ({
      clusterId: pool.clusterId,
      totalPax: pool.totalPax,
      qualityScore: pool.qualityScore || 0,
      stabilityTier: pool.stabilityTier || 'UNKNOWN',
      recommendation: pool.qualityScore && pool.qualityScore >= 80 
        ? 'EXCELLENT' 
        : pool.qualityScore && pool.qualityScore >= 60 
          ? 'GOOD' 
          : 'FAIR',
      pricing: {
        grandTotal: pool.pricing.grandTotal,
        avgPricePerPax: Math.round((pool.pricing.grandTotal / pool.totalPax) * 100) / 100
      },
      metrics: {
        maxDetour: pool.maxDetourPercent,
        avgExtraTime: pool.extraTimeMinutes,
        totalKm: pool.totalRouteKm
      }
    }));

    const rejectedFormatted = rankingResult.rejectedPools.map(r => ({
      clusterId: r.pool.clusterId,
      reason: r.reason,
      violations: r.violations
    }));

    const response: RankPoolsResponse = {
      success: true,
      flightNumber,
      date,
      ranking: {
        confirmable: confirmableFormatted,
        rejected: rejectedFormatted
      },
      stats: {
        totalCandidates: rankingResult.stats.totalCandidates,
        confirmable: rankingResult.stats.passedSoftThreshold,
        rejected: rankingResult.stats.rejectedByConstraints + rankingResult.stats.rejectedByScore
      },
      report: includeDetails ? generateRankingReport(rankingResult) : undefined
    };

    console.log(`[RankPools] Ranking completed: ${confirmableFormatted.length} confirmable, ${rejectedFormatted.length} rejected`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('[RankPools] Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      flightNumber: '',
      date: '',
      ranking: { confirmable: [], rejected: [] },
      stats: { totalCandidates: 0, confirmable: 0, rejected: 0 }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/matching/rank-pools
 * Health check e documentazione
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/matching/rank-pools',
    method: 'POST',
    description: 'Rank all pools for a flight using quality scoring and constraints',
    algorithm: {
      step1: 'Apply HARD constraints (≥2 pax, ≤7 pax, detour ≤20%, time ≤10min)',
      step2: 'Calculate quality score (40% saving + 30% time + 20% detour + 10% compatibility)',
      step3: 'Apply SOFT threshold (2-pax pools need score ≥70)',
      step4: 'Sort by score with tie-breaking (pax count > time > stops)'
    },
    parameters: {
      required: ['flightNumber', 'date'],
      optional: ['includeDetails (boolean)']
    },
    example: {
      flightNumber: 'FR1234',
      date: '2025-10-15',
      includeDetails: true
    }
  });
}