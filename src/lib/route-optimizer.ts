/**
 * Route Optimization with Mapbox Integration
 * Calcola percorsi ottimali e metriche per ride-sharing
 * 
 * @module route-optimizer
 */

import { haversineDistance } from './dbscan-clustering';

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  type: 'airport' | 'pickup' | 'dropoff';
  bookingId?: string;
  address?: string;
}

export interface OptimizedRoute {
  distance: number; // km totali
  duration: number; // minuti totali
  waypoints: Waypoint[]; // ordine ottimale
  geometry?: string; // encoded polyline
}

export interface PassengerMetrics {
  bookingId: string;
  kmOnboard: number; // km percorsi dal passeggero
  directDistance: number; // distanza diretta airport -> dest
  detourPercent: number; // % detour rispetto rotta diretta
  extraTimeMinutes: number; // tempo extra rispetto rotta diretta
  pickupIndex: number; // posizione nel route
  dropoffIndex: number;
}

interface MapboxMatrixResponse {
  code: string;
  durations: number[][]; // secondi
  distances: number[][]; // metri
}

interface MapboxOptimizationResponse {
  code: string;
  trips: Array<{
    distance: number; // metri
    duration: number; // secondi
    geometry: string;
    legs: Array<{
      distance: number;
      duration: number;
      steps: any[];
    }>;
  }>;
  waypoints: Array<{
    waypoint_index: number;
    trips_index: number;
    location: [number, number];
  }>;
}

const MAPBOX_SECRET_TOKEN = process.env.MAPBOX_SECRET_TOKEN;
const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'http://router.project-osrm.org';

// Cache per Matrix API (in memoria - usare Redis in produzione)
const matrixCache = new Map<string, MapboxMatrixResponse>();
const CACHE_TTL = 3600000; // 1 ora

/**
 * Genera cache key per Matrix API
 */
function generateCacheKey(coordinates: string): string {
  return `matrix:${coordinates}`;
}

/**
 * Chiama Mapbox Matrix API con retry logic
 * 
 * @param coordinates - Array di [lng, lat] coordinate
 * @returns Matrice di distanze e durate
 */
async function callMapboxMatrix(
  coordinates: Array<[number, number]>
): Promise<MapboxMatrixResponse> {
  const coordString = coordinates.map(c => c.join(',')).join(';');
  const cacheKey = generateCacheKey(coordString);
  
  // Check cache
  if (matrixCache.has(cacheKey)) {
    console.log(`[MapboxMatrix] Cache hit for ${coordinates.length} coords`);
    return matrixCache.get(cacheKey)!;
  }
  
  const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordString}`;
  const params = new URLSearchParams({
    access_token: MAPBOX_SECRET_TOKEN || '',
    annotations: 'distance,duration'
  });
  
  let retries = 3;
  let delay = 1000;
  
  while (retries > 0) {
    try {
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status === 429) {
        // Rate limit - exponential backoff
        console.warn(`[MapboxMatrix] Rate limited, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        retries--;
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`Mapbox Matrix API error: ${response.status}`);
      }
      
      const data: MapboxMatrixResponse = await response.json();
      
      if (data.code !== 'Ok') {
        throw new Error(`Mapbox Matrix failed: ${data.code}`);
      }
      
      // Store in cache
      matrixCache.set(cacheKey, data);
      setTimeout(() => matrixCache.delete(cacheKey), CACHE_TTL);
      
      return data;
      
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('[MapboxMatrix] All retries failed:', error);
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  
  throw new Error('Matrix API failed after retries');
}

/**
 * Fallback: calcola matrice distanze con OSRM self-hosted
 */
async function callOSRMMatrix(
  coordinates: Array<[number, number]>
): Promise<MapboxMatrixResponse> {
  const coordString = coordinates.map(c => c.join(',')).join(';');
  const url = `${OSRM_BASE_URL}/table/v1/driving/${coordString}`;
  const params = new URLSearchParams({
    annotations: 'distance,duration'
  });
  
  const response = await fetch(`${url}?${params}`);
  
  if (!response.ok) {
    throw new Error(`OSRM Matrix error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    code: data.code === 'Ok' ? 'Ok' : 'Error',
    durations: data.durations,
    distances: data.distances
  };
}

/**
 * Chiama Mapbox Optimization API per route ottimale
 * 
 * @param waypoints - Punti da visitare (airport first)
 * @returns Route ottimizzata
 */
async function callMapboxOptimization(
  waypoints: Waypoint[]
): Promise<MapboxOptimizationResponse> {
  // Coordinate: airport è source (primo punto fisso)
  const coordinates = waypoints.map(w => [w.lng, w.lat] as [number, number]);
  const coordString = coordinates.map(c => c.join(',')).join(';');
  
  const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordString}`;
  const params = new URLSearchParams({
    access_token: MAPBOX_SECRET_TOKEN || '',
    source: 'first', // Airport è sempre primo
    destination: 'any', // Ultimo dropoff ottimale
    roundtrip: 'false',
    geometries: 'polyline'
  });
  
  let retries = 3;
  let delay = 1000;
  
  while (retries > 0) {
    try {
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status === 429) {
        console.warn(`[MapboxOptimization] Rate limited, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        retries--;
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`Mapbox Optimization API error: ${response.status}`);
      }
      
      const data: MapboxOptimizationResponse = await response.json();
      
      if (data.code !== 'Ok') {
        throw new Error(`Mapbox Optimization failed: ${data.code}`);
      }
      
      return data;
      
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('[MapboxOptimization] All retries failed:', error);
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  
  throw new Error('Optimization API failed after retries');
}

/**
 * Fallback: ottimizza route con algoritmo greedy nearest-neighbor
 */
function optimizeRouteGreedy(waypoints: Waypoint[]): Waypoint[] {
  if (waypoints.length <= 2) return waypoints;
  
  const optimized = [waypoints[0]]; // Airport sempre primo
  const remaining = waypoints.slice(1);
  
  while (remaining.length > 0) {
    const current = optimized[optimized.length - 1];
    let nearestIndex = 0;
    let minDist = Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const dist = haversineDistance(
        current.lat, current.lng,
        remaining[i].lat, remaining[i].lng
      );
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }
    
    optimized.push(remaining[nearestIndex]);
    remaining.splice(nearestIndex, 1);
  }
  
  return optimized;
}

/**
 * Ottimizza route per un cluster di passeggeri
 * 
 * @param waypoints - Array di waypoints (airport + pickups + dropoffs)
 * @returns Route ottimizzata con metriche
 */
export async function optimizeRoute(
  waypoints: Waypoint[]
): Promise<OptimizedRoute> {
  if (waypoints.length < 2) {
    throw new Error('Need at least 2 waypoints (airport + destination)');
  }
  
  try {
    // Prova Mapbox Optimization API
    const result = await callMapboxOptimization(waypoints);
    const trip = result.trips[0];
    
    // Riordina waypoints secondo ottimizzazione
    const optimizedWaypoints = result.waypoints
      .sort((a, b) => a.waypoint_index - b.waypoint_index)
      .map(w => waypoints[w.waypoint_index]);
    
    return {
      distance: trip.distance / 1000, // metri -> km
      duration: trip.duration / 60, // secondi -> minuti
      waypoints: optimizedWaypoints,
      geometry: trip.geometry
    };
    
  } catch (error) {
    console.error('[RouteOptimizer] Mapbox failed, using greedy fallback:', error);
    
    // Fallback: greedy nearest-neighbor
    const optimizedWaypoints = optimizeRouteGreedy(waypoints);
    
    // Calcola distanza totale con haversine
    let totalDistance = 0;
    for (let i = 0; i < optimizedWaypoints.length - 1; i++) {
      totalDistance += haversineDistance(
        optimizedWaypoints[i].lat,
        optimizedWaypoints[i].lng,
        optimizedWaypoints[i + 1].lat,
        optimizedWaypoints[i + 1].lng
      );
    }
    
    // Stima durata: 50 km/h media
    const estimatedDuration = (totalDistance / 50) * 60;
    
    return {
      distance: totalDistance,
      duration: estimatedDuration,
      waypoints: optimizedWaypoints
    };
  }
}

/**
 * Calcola km percorsi da un passeggero (dal suo pickup al dropoff)
 * 
 * @param bookingId - ID del booking
 * @param route - Route ottimizzata
 * @returns Km onboard
 */
export function calculateKmOnboard(
  bookingId: string,
  route: OptimizedRoute
): number {
  // Trova indici pickup e dropoff del passeggero
  let pickupIndex = -1;
  let dropoffIndex = -1;
  
  for (let i = 0; i < route.waypoints.length; i++) {
    const w = route.waypoints[i];
    if (w.bookingId === bookingId) {
      if (w.type === 'pickup') pickupIndex = i;
      if (w.type === 'dropoff') dropoffIndex = i;
    }
  }
  
  if (pickupIndex === -1 || dropoffIndex === -1) {
    throw new Error(`Pickup/dropoff not found for booking ${bookingId}`);
  }
  
  // Calcola distanza tra pickup e dropoff lungo il route
  let kmOnboard = 0;
  for (let i = pickupIndex; i < dropoffIndex; i++) {
    const curr = route.waypoints[i];
    const next = route.waypoints[i + 1];
    kmOnboard += haversineDistance(curr.lat, curr.lng, next.lat, next.lng);
  }
  
  return Math.round(kmOnboard * 100) / 100;
}

/**
 * Calcola detour percentuale e tempo extra
 * 
 * @param directKm - Distanza diretta airport -> destination
 * @param actualKm - Distanza effettiva percorsa
 * @param directMinutes - Tempo diretto stimato
 * @param actualMinutes - Tempo effettivo
 * @returns Detour % e extra time
 */
export function calculateDetour(
  directKm: number,
  actualKm: number,
  directMinutes: number,
  actualMinutes: number
): { detourPercent: number; extraTimeMinutes: number } {
  const detourPercent = ((actualKm - directKm) / directKm) * 100;
  const extraTimeMinutes = actualMinutes - directMinutes;
  
  return {
    detourPercent: Math.round(detourPercent * 10) / 10,
    extraTimeMinutes: Math.round(extraTimeMinutes * 10) / 10
  };
}

/**
 * Calcola metriche per tutti i passeggeri nel route
 * 
 * @param route - Route ottimizzata
 * @param bookings - Info sui booking con destination originale
 * @returns Array di metriche per passeggero
 */
export async function calculatePassengerMetrics(
  route: OptimizedRoute,
  bookings: Array<{ id: string; lat: number; lng: number }>
): Promise<PassengerMetrics[]> {
  const airport = route.waypoints[0]; // Primo waypoint è sempre airport
  const metrics: PassengerMetrics[] = [];
  
  for (const booking of bookings) {
    // Distanza diretta airport -> destination
    const directKm = haversineDistance(
      airport.lat, airport.lng,
      booking.lat, booking.lng
    );
    
    // Tempo diretto stimato (50 km/h media)
    const directMinutes = (directKm / 50) * 60;
    
    // Km effettivi percorsi dal passeggero
    const kmOnboard = calculateKmOnboard(booking.id, route);
    
    // Trova indici nel route
    const pickupIndex = route.waypoints.findIndex(
      w => w.bookingId === booking.id && w.type === 'pickup'
    );
    const dropoffIndex = route.waypoints.findIndex(
      w => w.bookingId === booking.id && w.type === 'dropoff'
    );
    
    // Stima tempo effettivo (km onboard / velocità media)
    const actualMinutes = (kmOnboard / 50) * 60;
    
    // Calcola detour
    const detour = calculateDetour(directKm, kmOnboard, directMinutes, actualMinutes);
    
    metrics.push({
      bookingId: booking.id,
      kmOnboard,
      directDistance: Math.round(directKm * 100) / 100,
      detourPercent: detour.detourPercent,
      extraTimeMinutes: detour.extraTimeMinutes,
      pickupIndex,
      dropoffIndex
    });
  }
  
  return metrics;
}

/**
 * Valida che il route rispetti i vincoli business
 * 
 * @param metrics - Metriche dei passeggeri
 * @param clusterSize - Numero di passeggeri
 * @returns true se valido
 */
export function validateRouteConstraints(
  metrics: PassengerMetrics[],
  clusterSize: number
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  for (const m of metrics) {
    // Pool da 2 pax: detour ≤ 10% e time ≤ 6 min
    if (clusterSize === 2) {
      if (m.detourPercent > 10) {
        violations.push(`Booking ${m.bookingId}: detour ${m.detourPercent}% > 10%`);
      }
      if (m.extraTimeMinutes > 6) {
        violations.push(`Booking ${m.bookingId}: extra time ${m.extraTimeMinutes}min > 6min`);
      }
    }
    
    // Detour massimo generale: 20% o 10 minuti
    if (m.detourPercent > 20) {
      violations.push(`Booking ${m.bookingId}: detour ${m.detourPercent}% > 20% (max)`);
    }
    if (m.extraTimeMinutes > 10) {
      violations.push(`Booking ${m.bookingId}: extra time ${m.extraTimeMinutes}min > 10min (max)`);
    }
  }
  
  return {
    valid: violations.length === 0,
    violations
  };
}