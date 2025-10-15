/**
 * Matching Algorithm per Flanvo
 * Ranking intelligente dei pool con approccio NON-gatekeeper
 * 
 * @module matching-algorithm
 */

import type { PassengerMetrics } from './route-optimizer';
import type { ClusterPricing, PassengerPricing } from './pricing-calculator';
import { calculateQualityScore, type QualityScore, type StabilityTier } from './quality-scorer';

export interface PoolCandidate {
  clusterId: string;
  totalPax: number;
  totalRouteKm: number;
  totalDuration: number; // minuti
  maxDetourPercent: number;
  extraTimeMinutes: number;
  waypoints: number; // numero di fermate
  centroid: { lat: number; lng: number };
  
  // Metriche calcolate
  passengerMetrics: PassengerMetrics[];
  pricing: ClusterPricing;
  
  // Quality scoring
  qualityScore?: number;
  stabilityTier?: StabilityTier;
  
  // Metadata
  bookingIds: string[];
  createdAt?: Date;
}

export interface RankingResult {
  confirmablePools: PoolCandidate[];
  rejectedPools: Array<{
    pool: PoolCandidate;
    reason: string;
    violations: string[];
  }>;
  stats: {
    totalCandidates: number;
    passedHardConstraints: number;
    passedSoftThreshold: number;
    rejectedByConstraints: number;
    rejectedByScore: number;
  };
}

/**
 * STEP 1: Applica HARD CONSTRAINTS (fisica, safety)
 * Questi sono vincoli assoluti che non possono essere violati
 * 
 * @param pool - Pool candidate
 * @returns true se passa tutti i vincoli hard
 */
function passesHardConstraints(pool: PoolCandidate): { 
  valid: boolean; 
  violations: string[] 
} {
  const violations: string[] = [];
  
  // HC1: Minimo 2 passeggeri
  if (pool.totalPax < 2) {
    violations.push('Cluster size < 2 passeggeri (minimo richiesto)');
  }
  
  // HC2: Massimo 7 passeggeri
  if (pool.totalPax > 7) {
    violations.push('Cluster size > 7 passeggeri (massimo consentito)');
  }
  
  // HC3: Detour massimo 20%
  if (pool.maxDetourPercent > 20) {
    violations.push(`Detour ${pool.maxDetourPercent.toFixed(1)}% > 20% (limite massimo)`);
  }
  
  // HC4: Extra time massimo 10 minuti
  if (pool.extraTimeMinutes > 10) {
    violations.push(`Extra time ${pool.extraTimeMinutes.toFixed(1)}min > 10min (limite massimo)`);
  }
  
  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * STEP 2: Applica SOFT THRESHOLD per pool da 2 passeggeri
 * Pool da 2 pax devono avere quality score ≥ 70
 * Pool da 3+ pax sono sempre OK se passano hard constraints
 * 
 * @param pool - Pool candidate
 * @returns true se passa il threshold
 */
function passesSoftThreshold(pool: PoolCandidate): { 
  valid: boolean; 
  reason?: string 
} {
  // Pool da 3+ sempre OK
  if (pool.totalPax >= 3) {
    return { valid: true };
  }
  
  // Pool da 2 pax: controllo quality score
  if (pool.totalPax === 2) {
    if (!pool.qualityScore) {
      return { 
        valid: false, 
        reason: 'Quality score non calcolato per pool da 2 pax' 
      };
    }
    
    if (pool.qualityScore < 70) {
      return { 
        valid: false, 
        reason: `Quality score ${pool.qualityScore.toFixed(1)} < 70 (soglia per 2 pax)` 
      };
    }
    
    return { valid: true };
  }
  
  // Pool da 1 pax (non dovrebbe accadere se HC1 applicato)
  return { 
    valid: false, 
    reason: 'Pool da 1 passeggero non valido' 
  };
}

/**
 * STEP 3: Tie-breaking per ordinamento
 * In caso di quality score uguale, ordina per:
 * 1. Numero passeggeri (più = meglio) → economia di scala
 * 2. Extra time (meno = meglio) → migliore esperienza
 * 3. Numero fermate (meno = meglio) → route più semplice
 * 
 * @param a - Pool A
 * @param b - Pool B
 * @returns Valore per sort (negativo se a < b)
 */
function tieBreakingSort(a: PoolCandidate, b: PoolCandidate): number {
  // 1. Quality score (più alto = meglio)
  if (a.qualityScore !== undefined && b.qualityScore !== undefined) {
    const scoreDiff = b.qualityScore - a.qualityScore;
    if (Math.abs(scoreDiff) > 0.1) { // Tolleranza per floating point
      return scoreDiff;
    }
  }
  
  // TIE-BREAK 1: Numero passeggeri (più = meglio)
  if (a.totalPax !== b.totalPax) {
    return b.totalPax - a.totalPax;
  }
  
  // TIE-BREAK 2: Extra time (meno = meglio)
  if (Math.abs(a.extraTimeMinutes - b.extraTimeMinutes) > 0.1) {
    return a.extraTimeMinutes - b.extraTimeMinutes;
  }
  
  // TIE-BREAK 3: Numero fermate (meno = meglio)
  if (a.waypoints !== b.waypoints) {
    return a.waypoints - b.waypoints;
  }
  
  // Se ancora uguale, mantieni ordine originale
  return 0;
}

/**
 * ALGORITMO PRINCIPALE: Ranking & Filtering dei pool
 * 
 * Approccio NON-gatekeeper:
 * - Prima applica HARD CONSTRAINTS (fisica, safety)
 * - POI calcola score per ranking
 * - Soglia SOFT solo per 2 pax: score ≥ 70
 * - Pool da 3+ sempre OK se passano hard constraints
 * 
 * @param candidates - Array di pool candidati
 * @returns Risultato con pool ordinati e statistiche
 */
export function rankAndFilterPools(candidates: PoolCandidate[]): RankingResult {
  console.log(`[Matching] Starting ranking for ${candidates.length} candidates`);
  
  const rejectedPools: RankingResult['rejectedPools'] = [];
  let passedHardCount = 0;
  let passedSoftCount = 0;
  
  // STEP 1: Filtra per HARD CONSTRAINTS
  const hardFiltered = candidates.filter(pool => {
    const hardCheck = passesHardConstraints(pool);
    
    if (!hardCheck.valid) {
      rejectedPools.push({
        pool,
        reason: 'Hard constraints violated',
        violations: hardCheck.violations
      });
      return false;
    }
    
    passedHardCount++;
    return true;
  });
  
  console.log(`[Matching] ${hardFiltered.length}/${candidates.length} passed hard constraints`);
  
  // STEP 2: Calcola quality score per tutti i pool validi
  hardFiltered.forEach(pool => {
    // Calcola average detour e extra time
    const avgDetour = pool.passengerMetrics.reduce((sum, m) => sum + m.detourPercent, 0) / pool.passengerMetrics.length;
    const avgExtraTime = pool.passengerMetrics.reduce((sum, m) => sum + m.extraTimeMinutes, 0) / pool.passengerMetrics.length;
    
    // Calcola savings (assumendo che pricing contenga le info necessarie)
    const savings = pool.pricing.passengers.map(p => {
      // Stima solo price (assumendo 25% saving medio)
      const soloPrice = p.totalPrice / 0.75; // Se pool è 75% del solo
      const savingsPercent = ((soloPrice - p.totalPrice) / soloPrice) * 100;
      return {
        bookingId: p.bookingId,
        savingsPercent
      };
    });
    
    // Calcola quality score
    const qualityScore = calculateQualityScore({
      clusterSize: pool.totalPax,
      metrics: pool.passengerMetrics,
      savings,
      totalRouteKm: pool.totalRouteKm,
      averageDetourPercent: avgDetour,
      averageExtraTimeMinutes: avgExtraTime,
      centroid: pool.centroid,
      luggageData: undefined // TODO: aggiungere se disponibile
    });
    
    pool.qualityScore = qualityScore.overall;
    pool.stabilityTier = qualityScore.stabilityTier;
  });
  
  console.log(`[Matching] Quality scores calculated for ${hardFiltered.length} pools`);
  
  // STEP 3: Applica SOFT THRESHOLD (solo per 2 pax)
  const confirmable = hardFiltered.filter(pool => {
    const softCheck = passesSoftThreshold(pool);
    
    if (!softCheck.valid) {
      rejectedPools.push({
        pool,
        reason: softCheck.reason || 'Soft threshold not met',
        violations: []
      });
      return false;
    }
    
    passedSoftCount++;
    return true;
  });
  
  console.log(`[Matching] ${confirmable.length}/${hardFiltered.length} passed soft threshold`);
  
  // STEP 4: Ordina per score + tie-breaking
  confirmable.sort(tieBreakingSort);
  
  console.log(`[Matching] Pools ranked. Top pool: ${confirmable[0]?.clusterId} (score: ${confirmable[0]?.qualityScore?.toFixed(1)})`);
  
  // Statistiche finali
  const stats = {
    totalCandidates: candidates.length,
    passedHardConstraints: passedHardCount,
    passedSoftThreshold: passedSoftCount,
    rejectedByConstraints: candidates.length - passedHardCount,
    rejectedByScore: passedHardCount - passedSoftCount
  };
  
  return {
    confirmablePools: confirmable,
    rejectedPools,
    stats
  };
}

/**
 * Helper: Trova il best match per un nuovo booking
 * 
 * @param newBooking - Booking da matchare
 * @param existingPools - Pool esistenti
 * @returns Best pool o null
 */
export function findBestMatch(
  newBooking: { id: string; destination: { lat: number; lng: number } },
  existingPools: PoolCandidate[]
): { bestPool: PoolCandidate | null; alternatives: PoolCandidate[]; recommendation: string } {
  
  if (existingPools.length === 0) {
    return {
      bestPool: null,
      alternatives: [],
      recommendation: 'No existing pools - wait for more passengers or create new group'
    };
  }
  
  // Ranking dei pool
  const ranking = rankAndFilterPools(existingPools);
  
  if (ranking.confirmablePools.length === 0) {
    return {
      bestPool: null,
      alternatives: [],
      recommendation: 'No valid pools available - all rejected by constraints'
    };
  }
  
  const bestPool = ranking.confirmablePools[0];
  const alternatives = ranking.confirmablePools.slice(1, 4); // Top 3 alternative
  
  let recommendation = '';
  if (bestPool.qualityScore && bestPool.qualityScore >= 80) {
    recommendation = `Excellent match found! Pool ${bestPool.clusterId} with ${bestPool.totalPax} passengers (score: ${bestPool.qualityScore.toFixed(1)})`;
  } else if (bestPool.qualityScore && bestPool.qualityScore >= 60) {
    recommendation = `Good match found. Pool ${bestPool.clusterId} with ${bestPool.totalPax} passengers (score: ${bestPool.qualityScore.toFixed(1)})`;
  } else {
    recommendation = `Fair match available. Consider waiting for better options or check alternatives.`;
  }
  
  return {
    bestPool,
    alternatives,
    recommendation
  };
}

/**
 * Genera report dettagliato del ranking
 */
export function generateRankingReport(result: RankingResult): string {
  const lines = [
    `📊 Pool Ranking Report`,
    ``,
    `Total Candidates: ${result.stats.totalCandidates}`,
    `✅ Passed Hard Constraints: ${result.stats.passedHardConstraints}`,
    `✅ Passed Soft Threshold: ${result.stats.passedSoftThreshold}`,
    `❌ Rejected by Constraints: ${result.stats.rejectedByConstraints}`,
    `❌ Rejected by Score: ${result.stats.rejectedByScore}`,
    ``,
    `🏆 Top Confirmable Pools (${result.confirmablePools.length}):`
  ];
  
  result.confirmablePools.slice(0, 5).forEach((pool, idx) => {
    lines.push(
      `  ${idx + 1}. ${pool.clusterId} - ${pool.totalPax} pax - Score: ${pool.qualityScore?.toFixed(1)} - ${pool.stabilityTier}`
    );
  });
  
  if (result.rejectedPools.length > 0) {
    lines.push(``);
    lines.push(`❌ Rejected Pools (${result.rejectedPools.length}):`);
    result.rejectedPools.slice(0, 3).forEach(r => {
      lines.push(`  • ${r.pool.clusterId}: ${r.reason}`);
      if (r.violations.length > 0) {
        r.violations.forEach(v => lines.push(`    - ${v}`));
      }
    });
  }
  
  return lines.join('\n');
}

/**
 * Test case example
 */
export function testMatchingAlgorithm(): void {
  console.log('=== Flanvo Matching Algorithm Test ===\n');
  
  // Mock pool candidates
  const mockPools: PoolCandidate[] = [
    {
      clusterId: 'pool-1',
      totalPax: 3,
      totalRouteKm: 60,
      totalDuration: 75,
      maxDetourPercent: 8.5,
      extraTimeMinutes: 3.2,
      waypoints: 4,
      centroid: { lat: 45.464, lng: 9.190 },
      passengerMetrics: [
        { bookingId: 'BK001', kmOnboard: 50, directDistance: 48, detourPercent: 4.2, extraTimeMinutes: 2.5, pickupIndex: 1, dropoffIndex: 4 },
        { bookingId: 'BK002', kmOnboard: 52, directDistance: 49, detourPercent: 6.1, extraTimeMinutes: 3.1, pickupIndex: 2, dropoffIndex: 5 },
        { bookingId: 'BK003', kmOnboard: 48, directDistance: 46, detourPercent: 4.3, extraTimeMinutes: 2.0, pickupIndex: 3, dropoffIndex: 6 }
      ],
      pricing: {
        totalRouteKm: 60,
        totalDriverCost: 120,
        totalFlanvoFee: 38,
        grandTotal: 158,
        passengers: [
          // ✅ MODELLO EQUO: Driver €120 ÷ 3 = €40 per tutti
          { bookingId: 'BK001', kmOnboard: 50, driverCost: 40, flanvoFee: 12.5, totalPrice: 52.5, sharePercent: 83, breakdown: { driverRate: 2, flanvoRate: 0.25, originalTotal: 52.5, pennyAdjustment: 0 } },
          { bookingId: 'BK002', kmOnboard: 52, driverCost: 40, flanvoFee: 13, totalPrice: 53, sharePercent: 87, breakdown: { driverRate: 2, flanvoRate: 0.25, originalTotal: 53, pennyAdjustment: 0 } },
          { bookingId: 'BK003', kmOnboard: 48, driverCost: 40, flanvoFee: 12, totalPrice: 52, sharePercent: 80, breakdown: { driverRate: 2, flanvoRate: 0.25, originalTotal: 52, pennyAdjustment: 0 } }
        ],
        validation: { sumMatchesTotal: true, difference: 0 }
      },
      bookingIds: ['BK001', 'BK002', 'BK003']
    },
    {
      clusterId: 'pool-2',
      totalPax: 2,
      totalRouteKm: 55,
      totalDuration: 70,
      maxDetourPercent: 12.3,
      extraTimeMinutes: 5.8,
      waypoints: 3,
      centroid: { lat: 45.451, lng: 9.175 },
      passengerMetrics: [
        { bookingId: 'BK004', kmOnboard: 50, directDistance: 45, detourPercent: 11.1, extraTimeMinutes: 5.5, pickupIndex: 1, dropoffIndex: 3 },
        { bookingId: 'BK005', kmOnboard: 52, directDistance: 46, detourPercent: 13.0, extraTimeMinutes: 6.1, pickupIndex: 2, dropoffIndex: 4 }
      ],
      pricing: {
        totalRouteKm: 55,
        totalDriverCost: 110,
        totalFlanvoFee: 25.5,
        grandTotal: 135.5,
        passengers: [
          // ✅ MODELLO EQUO: Driver €110 ÷ 2 = €55 per tutti
          { bookingId: 'BK004', kmOnboard: 50, driverCost: 55, flanvoFee: 12.5, totalPrice: 67.5, sharePercent: 91, breakdown: { driverRate: 2, flanvoRate: 0.25, originalTotal: 67.5, pennyAdjustment: 0 } },
          { bookingId: 'BK005', kmOnboard: 52, driverCost: 55, flanvoFee: 13, totalPrice: 68, sharePercent: 95, breakdown: { driverRate: 2, flanvoRate: 0.25, originalTotal: 68, pennyAdjustment: 0 } }
        ],
        validation: { sumMatchesTotal: true, difference: 0 }
      },
      bookingIds: ['BK004', 'BK005']
    }
  ];
  
  const ranking = rankAndFilterPools(mockPools);
  console.log(generateRankingReport(ranking));
}