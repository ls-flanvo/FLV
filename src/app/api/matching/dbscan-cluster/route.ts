/**
 * API Endpoint: DBSCAN Clustering per volo
 * POST /api/matching/dbscan-cluster
 * 
 * Raggruppa tutti i booking dello stesso volo usando DBSCAN
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { dbscan, filterClustersByBusinessRules, type Point } from '@/lib/dbscan-clustering';

const prisma = new PrismaClient();

interface ClusterRequest {
  flightNumber: string;
  date: string; // ISO format: 2025-10-15
  eps?: number; // Optional, default 8.5 km
  minSamples?: number; // Optional, default 2
}

interface ClusterResponse {
  success: boolean;
  flightNumber: string;
  date: string;
  clusters: Array<{
    id: number;
    size: number;
    centroid: { lat: number; lng: number };
    bookings: Array<{
      bookingId: string;
      destination: { lat: number; lng: number };
      passengerName?: string;
    }>;
  }>;
  noise: Array<{
    bookingId: string;
    destination: { lat: number; lng: number };
    reason: string;
  }>;
  stats: {
    totalBookings: number;
    clustersFound: number;
    validClusters: number;
    noisePoints: number;
    averageClusterSize: number;
  };
  parameters: {
    eps: number;
    minSamples: number;
  };
  error?: string;
}

/**
 * POST /api/matching/dbscan-cluster
 * Esegue clustering DBSCAN su tutti i bookings di un volo
 */
export async function POST(request: NextRequest): Promise<NextResponse<ClusterResponse>> {
  try {
    const body: ClusterRequest = await request.json();
    const { flightNumber, date, eps = 8.5, minSamples = 2 } = body;

    // Validazione input
    if (!flightNumber || !date) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: flightNumber, date',
        flightNumber: flightNumber || '',
        date: date || '',
        clusters: [],
        noise: [],
        stats: {
          totalBookings: 0,
          clustersFound: 0,
          validClusters: 0,
          noisePoints: 0,
          averageClusterSize: 0
        },
        parameters: { eps, minSamples }
      }, { status: 400 });
    }

    console.log(`[DBSCAN] Starting clustering for flight ${flightNumber} on ${date}`);
    console.log(`[DBSCAN] Parameters: eps=${eps}km, minSamples=${minSamples}`);

    // Query bookings dal database
    // Assumendo schema: Booking { id, flightNumber, flightDate, destinationLat, destinationLng, status }
    const bookings = await prisma.booking.findMany({
      where: {
        flightNumber,
        flightDate: new Date(date),
        status: 'CONFIRMED',
        destinationLat: { not: null },
        destinationLng: { not: null }
      },
      select: {
        id: true,
        destinationLat: true,
        destinationLng: true,
        passengerName: true,
        destinationAddress: true
      }
    });

    if (bookings.length === 0) {
      return NextResponse.json({
        success: true,
        flightNumber,
        date,
        clusters: [],
        noise: [],
        stats: {
          totalBookings: 0,
          clustersFound: 0,
          validClusters: 0,
          noisePoints: 0,
          averageClusterSize: 0
        },
        parameters: { eps, minSamples }
      });
    }

    console.log(`[DBSCAN] Found ${bookings.length} confirmed bookings`);

    // Converti bookings in Points per DBSCAN
    const points: Point[] = bookings.map(b => ({
      id: b.id,
      bookingId: b.id,
      lat: b.destinationLat!,
      lng: b.destinationLng!,
      metadata: {
        passengerName: b.passengerName,
        address: b.destinationAddress
      }
    }));

    // Esegui DBSCAN clustering
    const dbscanResult = dbscan(points, eps, minSamples);
    console.log(`[DBSCAN] Raw clustering: ${dbscanResult.clusters.length} clusters, ${dbscanResult.noise.length} noise`);

    // Applica business rules (filtra <2 pax, splitta >7 pax)
    const validClusters = filterClustersByBusinessRules(dbscanResult.clusters);
    console.log(`[DBSCAN] After business rules: ${validClusters.length} valid clusters`);

    // Formatta response
    const clustersFormatted = validClusters.map(cluster => ({
      id: cluster.id,
      size: cluster.points.length,
      centroid: cluster.centroid,
      bookings: cluster.points.map(p => ({
        bookingId: p.bookingId,
        destination: { lat: p.lat, lng: p.lng },
        passengerName: p.metadata?.passengerName
      }))
    }));

    const noiseFormatted = dbscanResult.noise.map(p => ({
      bookingId: p.bookingId,
      destination: { lat: p.lat, lng: p.lng },
      reason: 'No neighbors within eps radius or cluster too small'
    }));

    // Calcola statistiche finali
    const validClustersSizes = validClusters.map(c => c.points.length);
    const avgClusterSize = validClustersSizes.length > 0
      ? validClustersSizes.reduce((a, b) => a + b, 0) / validClustersSizes.length
      : 0;

    const response: ClusterResponse = {
      success: true,
      flightNumber,
      date,
      clusters: clustersFormatted,
      noise: noiseFormatted,
      stats: {
        totalBookings: bookings.length,
        clustersFound: dbscanResult.clusters.length,
        validClusters: validClusters.length,
        noisePoints: dbscanResult.noise.length,
        averageClusterSize: Math.round(avgClusterSize * 100) / 100
      },
      parameters: { eps, minSamples }
    };

    console.log(`[DBSCAN] Clustering completed successfully`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('[DBSCAN] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      flightNumber: '',
      date: '',
      clusters: [],
      noise: [],
      stats: {
        totalBookings: 0,
        clustersFound: 0,
        validClusters: 0,
        noisePoints: 0,
        averageClusterSize: 0
      },
      parameters: { eps: 8.5, minSamples: 2 }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/matching/dbscan-cluster
 * Health check e documentazione
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/matching/dbscan-cluster',
    method: 'POST',
    description: 'Run DBSCAN clustering on flight bookings',
    parameters: {
      required: ['flightNumber', 'date'],
      optional: ['eps (default: 8.5)', 'minSamples (default: 2)']
    },
    example: {
      flightNumber: 'FR1234',
      date: '2025-10-15',
      eps: 8.5,
      minSamples: 2
    }
  });
}