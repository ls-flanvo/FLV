/**
 * API Endpoint: Optimize Route and Calculate Pricing
 * POST /api/matching/optimize-and-price
 * 
 * Ottimizza route con Mapbox, calcola pricing e valida constraints
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { optimizeRoute, calculatePassengerMetrics, validateRouteConstraints, type Waypoint } from '@/lib/route-optimizer';
import { calculatePricing, calculateSavings, type ClusterPricing } from '@/lib/pricing-calculator';
import { calculateQualityScore, type QualityScore, type ClusterQualityInput } from '@/lib/quality-scorer';
import { rankAndFilterPools, type PoolCandidate } from '@/lib/matching-algorithm';

const prisma = new PrismaClient();

interface OptimizeAndPriceRequest {
  clusterId: string;
  airportCoordinates: { lat: number; lng: number }; // Airport di partenza
}

interface OptimizeAndPriceResponse {
  success: boolean;
  clusterId: string;
  route: {
    distance: number; // km totali
    duration: number; // minuti totali
    waypoints: Array<{
      type: 'airport' | 'pickup' | 'dropoff';
      location: { lat: number; lng: number };
      bookingId?: string;
      address?: string;
    }>;
    geometry?: string; // Encoded polyline
  };
  passengerMetrics: Array<{
    bookingId: string;
    kmOnboard: number;
    directDistance: number;
    detourPercent: number;
    extraTimeMinutes: number;
  }>;
  pricing: ClusterPricing;
  qualityScore: QualityScore;
  validation: {
    constraintsValid: boolean;
    routeValid: boolean;
    violations: string[];
  };
  recommendations: {
    shouldProceed: boolean;
    reason: string;
    alternatives?: string[];
  };
  error?: string;
}

/**
 * Calcola prezzi "solo" per confronto savings
 */
async function calculateSoloPrices(
  bookings: Array<{ id: string; lat: number; lng: number }>,
  airportCoordinates: { lat: number; lng: number }
): Promise<Array<{ bookingId: string; soloPrice: number }>> {
  // Importo haversineDistance
  const { haversineDistance } = await import('@/lib/dbscan-clustering');
  
  return bookings.map(b => {
    const distanceKm = haversineDistance(
      airportCoordinates.lat,
      airportCoordinates.lng,
      b.lat,
      b.lng
    );
    
    // Prezzo solo: driver + flanvo fee tier appropriato
    const DRIVER_RATE = 2.0;
    const driverCost = distanceKm * DRIVER_RATE;
    
    // Flanvo fee per viaggio solo (usa tier medio 0.25)
    const flanvoFee = distanceKm * 0.25;
    
    const soloPrice = Math.round((driverCost + flanvoFee) * 100) / 100;
    
    return {
      bookingId: b.id,
      soloPrice
    };
  });
}

/**
 * POST /api/matching/optimize-and-price
 * Ottimizza route e calcola pricing completo
 */
export async function POST(request: NextRequest): Promise<NextResponse<OptimizeAndPriceResponse>> {
  try {
    const body: OptimizeAndPriceRequest = await request.json();
    const { clusterId, airportCoordinates } = body;

    if (!clusterId || !airportCoordinates) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: clusterId, airportCoordinates',
        clusterId: '',
        route: { distance: 0, duration: 0, waypoints: [] },
        passengerMetrics: [],
        pricing: {
          totalRouteKm: 0,
          totalDriverCost: 0,
          totalFlanvoFee: 0,
          grandTotal: 0,
          passengers: [],
          validation: { sumMatchesTotal: false, difference: 0 }
        },
        qualityScore: {
          overall: 0,
          breakdown: { priceSaving: 0, timeEfficiency: 0, routeDeviation: 0, compatibility: 0 },
          stabilityTier: 'REJECTED',
          recommendation: '',
          warnings: []
        },
        validation: { constraintsValid: false, routeValid: false, violations: [] },
        recommendations: { shouldProceed: false, reason: '' }
      }, { status: 400 });
    }

    console.log(`[OptimizeAndPrice] Processing cluster ${clusterId}`);

    // Query bookings del cluster
    // Assumendo che clusterId sia memorizzato nel DB
    const clusterBookings = await prisma.booking.findMany({
      where: {
        poolGroupId: clusterId,
        status: 'CONFIRMED'
      },
      select: {
        id: true,
        destinationLat: true,
        destinationLng: true,
        destinationAddress: true,
        passengerName: true
      }
    });

    if (clusterBookings.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No bookings found in cluster',
        clusterId,
        route: { distance: 0, duration: 0, waypoints: [] },
        passengerMetrics: [],
        pricing: {
          totalRouteKm: 0,
          totalDriverCost: 0,
          totalFlanvoFee: 0,
          grandTotal: 0,
          passengers: [],
          validation: { sumMatchesTotal: false, difference: 0 }
        },
        qualityScore: {
          overall: 0,
          breakdown: { priceSaving: 0, timeEfficiency: 0, routeDeviation: 0, compatibility: 0 },
          stabilityTier: 'REJECTED',
          recommendation: '',
          warnings: []
        },
        validation: { constraintsValid: false, routeValid: false, violations: [] },
        recommendations: { shouldProceed: false, reason: 'No bookings in cluster' }
      }, { status: 404 });
    }

    console.log(`[OptimizeAndPrice] Found ${clusterBookings.length} bookings`);

    // Costruisci waypoints per route optimization
    const waypoints: Waypoint[] = [
      // Airport sempre primo
      {
        id: 'airport',
        lat: airportCoordinates.lat,
        lng: airportCoordinates.lng,
        type: 'airport'
      }
    ];

    // Aggiungi pickup (tutti all'airport) e dropoff per ogni booking
    clusterBookings.forEach(booking => {
      // Pickup all'airport (già aggiunto sopra, quindi skip duplicati)
      // In un sistema reale, potresti avere pickup diversi
      
      // Dropoff alla destinazione
      waypoints.push({
        id: `dropoff-${booking.id}`,
        lat: booking.destinationLat!,
        lng: booking.destinationLng!,
        type: 'dropoff',
        bookingId: booking.id,
        address: booking.destinationAddress || undefined
      });
    });

    console.log(`[OptimizeAndPrice] Optimizing route with ${waypoints.length} waypoints`);

    // Ottimizza route con Mapbox
    let optimizedRoute;
    try {
      optimizedRoute = await optimizeRoute(waypoints);
    } catch (error) {
      console.error('[OptimizeAndPrice] Route optimization failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Route optimization failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        clusterId,
        route: { distance: 0, duration: 0, waypoints: [] },
        passengerMetrics: [],
        pricing: {
          totalRouteKm: 0,
          totalDriverCost: 0,
          totalFlanvoFee: 0,
          grandTotal: 0,
          passengers: [],
          validation: { sumMatchesTotal: false, difference: 0 }
        },
        qualityScore: {
          overall: 0,
          breakdown: { priceSaving: 0, timeEfficiency: 0, routeDeviation: 0, compatibility: 0 },
          stabilityTier: 'REJECTED',
          recommendation: '',
          warnings: []
        },
        validation: { constraintsValid: false, routeValid: false, violations: [] },
        recommendations: { shouldProceed: false, reason: 'Route optimization failed' }
      }, { status: 500 });
    }

    console.log(`[OptimizeAndPrice] Route optimized: ${optimizedRoute.distance}km, ${optimizedRoute.duration}min`);

    // Calcola metriche per ogni passeggero
    const bookingsData = clusterBookings.map(b => ({
      id: b.id,
      lat: b.destinationLat!,
      lng: b.destinationLng!
    }));

    const passengerMetrics = await calculatePassengerMetrics(optimizedRoute, bookingsData);
    console.log(`[OptimizeAndPrice] Calculated metrics for ${passengerMetrics.length} passengers`);

    // Valida constraints
    const constraintsValidation = validateRouteConstraints(passengerMetrics, clusterBookings.length);
    console.log(`[OptimizeAndPrice] Constraints valid: ${constraintsValidation.valid}`);

    // Calcola pricing
    const passengerKm = passengerMetrics.map(m => ({
      bookingId: m.bookingId,
      kmOnboard: m.kmOnboard
    }));

    const pricing = calculatePricing(optimizedRoute.distance, passengerKm);
    console.log(`[OptimizeAndPrice] Total pricing: €${pricing.grandTotal}`);

    // Calcola savings rispetto a viaggio solo
    const soloPrices = await calculateSoloPrices(bookingsData, airportCoordinates);
    const savings = calculateSavings(pricing, soloPrices);

    // Calcola quality score
    const qualityInput: ClusterQualityInput = {
      clusterSize: clusterBookings.length,
      metrics: passengerMetrics,
      savings: savings.map(s => ({ bookingId: s.bookingId, savingsPercent: s.savingsPercent })),
      totalRouteKm: optimizedRoute.distance,
      averageDetourPercent: passengerMetrics.reduce((sum, m) => sum + m.detourPercent, 0) / passengerMetrics.length,
      averageExtraTimeMinutes: passengerMetrics.reduce((sum, m) => sum + m.extraTimeMinutes, 0) / passengerMetrics.length,
      centroid: {
        // Calcola centroid delle destinazioni
        lat: clusterBookings.reduce((sum, b) => sum + b.destinationLat!, 0) / clusterBookings.length,
        lng: clusterBookings.reduce((sum, b) => sum + b.destinationLng!, 0) / clusterBookings.length
      },
      luggageData: clusterBookings.map(b => ({
        bookingId: b.id,
        luggageCount: (b as any).luggageCount || 2 // Default 2 se non specificato
      })),
      destinations: clusterBookings.map(b => ({ // ✅ NUOVO: passa destinazioni reali
        bookingId: b.id,
        lat: b.destinationLat!,
        lng: b.destinationLng!
      }))
    };

    const qualityScore = calculateQualityScore(qualityInput);
    console.log(`[OptimizeAndPrice] Quality score: ${qualityScore.overall}/100 (${qualityScore.stabilityTier})`);

    // Determina raccomandazioni
    const shouldProceed = constraintsValidation.valid && qualityScore.overall >= 40;
    let reason = '';
    const alternatives: string[] = [];

    if (!constraintsValidation.valid) {
      reason = 'Constraints violated - cannot proceed with this cluster';
      alternatives.push('Try adjusting cluster by removing problematic bookings');
      alternatives.push('Split cluster into smaller groups');
    } else if (qualityScore.overall < 40) {
      reason = 'Quality score too low - poor match';
      alternatives.push('Wait for more compatible passengers');
      alternatives.push('Adjust clustering parameters (eps, minSamples)');
    } else if (qualityScore.overall < 60) {
      reason = 'Fair match - proceed with caution';
      alternatives.push('Monitor customer satisfaction closely');
    } else {
      reason = 'Good match - proceed with confidence';
    }

    // Formatta response
    const response: OptimizeAndPriceResponse = {
      success: true,
      clusterId,
      route: {
        distance: optimizedRoute.distance,
        duration: optimizedRoute.duration,
        waypoints: optimizedRoute.waypoints.map(w => ({
          type: w.type,
          location: { lat: w.lat, lng: w.lng },
          bookingId: w.bookingId,
          address: w.address
        })),
        geometry: optimizedRoute.geometry
      },
      passengerMetrics: passengerMetrics.map(m => ({
        bookingId: m.bookingId,
        kmOnboard: m.kmOnboard,
        directDistance: m.directDistance,
        detourPercent: m.detourPercent,
        extraTimeMinutes: m.extraTimeMinutes
      })),
      pricing,
      qualityScore,
      validation: {
        constraintsValid: constraintsValidation.valid,
        routeValid: optimizedRoute.distance > 0,
        violations: constraintsValidation.violations
      },
      recommendations: {
        shouldProceed,
        reason,
        alternatives: alternatives.length > 0 ? alternatives : undefined
      }
    };

    console.log(`[OptimizeAndPrice] Processing completed successfully`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('[OptimizeAndPrice] Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      clusterId: '',
      route: { distance: 0, duration: 0, waypoints: [] },
      passengerMetrics: [],
      pricing: {
        totalRouteKm: 0,
        totalDriverCost: 0,
        totalFlanvoFee: 0,
        grandTotal: 0,
        passengers: [],
        validation: { sumMatchesTotal: false, difference: 0 }
      },
      qualityScore: {
        overall: 0,
        breakdown: { priceSaving: 0, timeEfficiency: 0, routeDeviation: 0, compatibility: 0 },
        stabilityTier: 'REJECTED',
        recommendation: '',
        warnings: []
      },
      validation: { constraintsValid: false, routeValid: false, violations: [] },
      recommendations: { shouldProceed: false, reason: 'Internal error' }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/matching/optimize-and-price
 * Health check e documentazione
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/matching/optimize-and-price',
    method: 'POST',
    description: 'Optimize route, calculate pricing and validate cluster quality',
    parameters: {
      required: ['clusterId', 'airportCoordinates'],
      optional: []
    },
    example: {
      clusterId: 'cluster-001',
      airportCoordinates: { lat: 45.6301, lng: 8.7231 } // Milano Malpensa
    },
    response: {
      route: 'Optimized route with waypoints',
      pricing: 'Per-passenger pricing breakdown',
      qualityScore: 'Quality metrics (0-100)',
      validation: 'Constraints validation',
      recommendations: 'Should proceed or alternatives'
    }
  });
}