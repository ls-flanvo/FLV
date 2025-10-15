/**
 * Quality Scoring System for Flanvo Clusters
 * Valuta la qualità del match e stabilità del cluster
 * 
 * @module quality-scorer
 */

import type { PassengerMetrics } from './route-optimizer';

export type StabilityTier = 'EXCELLENT' | 'GOOD' | 'REJECTED';

export interface QualityScore {
  overall: number; // 0-100
  breakdown: {
    priceSaving: number; // 0-40 punti
    timeEfficiency: number; // 0-30 punti
    routeDeviation: number; // 0-20 punti
    compatibility: number; // 0-10 punti
  };
  stabilityTier: StabilityTier;
  recommendation: string;
  warnings: string[];
}

export interface ClusterQualityInput {
  clusterSize: number;
  metrics: PassengerMetrics[];
  savings: Array<{ bookingId: string; savingsPercent: number }>;
  totalRouteKm: number;
  averageDetourPercent: number;
  averageExtraTimeMinutes: number;
  centroid: { lat: number; lng: number };
  luggageData?: Array<{ bookingId: string; luggageCount: number }>;
  destinations?: Array<{ bookingId: string; lat: number; lng: number }>; // ✅ NUOVO per corridoio
}

/**
 * Calcola score per price saving (0-40 punti)
 * Basato su risparmio medio dei passeggeri
 * 
 * @param savings - Array di savings percentuali
 * @returns Score 0-40
 */
function scorePriceSaving(savings: Array<{ savingsPercent: number }>): number {
  if (savings.length === 0) return 0;
  
  const avgSavings = savings.reduce((sum, s) => sum + s.savingsPercent, 0) / savings.length;
  
  // Scoring curve:
  // 0-10% saving → 0-10 punti
  // 10-30% saving → 10-30 punti
  // 30-50% saving → 30-40 punti
  // >50% saving → 40 punti
  
  if (avgSavings <= 0) return 0;
  if (avgSavings >= 50) return 40;
  if (avgSavings >= 30) return 30 + ((avgSavings - 30) / 20) * 10;
  if (avgSavings >= 10) return 10 + ((avgSavings - 10) / 20) * 20;
  return (avgSavings / 10) * 10;
}

/**
 * Calcola score per time efficiency (0-30 punti)
 * Penalizza extra time elevato
 * 
 * @param metrics - Metriche passeggeri
 * @returns Score 0-30
 */
function scoreTimeEfficiency(metrics: PassengerMetrics[]): number {
  if (metrics.length === 0) return 0;
  
  const avgExtraTime = metrics.reduce((sum, m) => sum + m.extraTimeMinutes, 0) / metrics.length;
  
  // Scoring curve:
  // 0-2 min → 30 punti (perfetto)
  // 2-6 min → 20-30 punti (buono)
  // 6-10 min → 10-20 punti (accettabile)
  // >10 min → 0-10 punti (scarso)
  
  if (avgExtraTime <= 0) return 30;
  if (avgExtraTime <= 2) return 30;
  if (avgExtraTime <= 6) return 20 + ((6 - avgExtraTime) / 4) * 10;
  if (avgExtraTime <= 10) return 10 + ((10 - avgExtraTime) / 4) * 10;
  
  // Penalità severa oltre 10 min
  return Math.max(0, 10 - (avgExtraTime - 10));
}

/**
 * Calcola score per route deviation (0-20 punti)
 * Penalizza detour elevato
 * 
 * @param metrics - Metriche passeggeri
 * @returns Score 0-20
 */
function scoreRouteDeviation(metrics: PassengerMetrics[]): number {
  if (metrics.length === 0) return 0;
  
  const avgDetour = metrics.reduce((sum, m) => sum + m.detourPercent, 0) / metrics.length;
  
  // Scoring curve:
  // 0-5% detour → 20 punti (ottimo)
  // 5-10% detour → 15-20 punti (buono)
  // 10-15% detour → 10-15 punti (accettabile)
  // 15-20% detour → 5-10 punti (limite)
  // >20% detour → 0-5 punti (scadente)
  
  if (avgDetour <= 0) return 20;
  if (avgDetour <= 5) return 20;
  if (avgDetour <= 10) return 15 + ((10 - avgDetour) / 5) * 5;
  if (avgDetour <= 15) return 10 + ((15 - avgDetour) / 5) * 5;
  if (avgDetour <= 20) return 5 + ((20 - avgDetour) / 5) * 5;
  
  // Penalità severa oltre 20%
  return Math.max(0, 5 - (avgDetour - 20) / 2);
}

/**
 * Calcola score per compatibility (0-100 punti)
 * Formula Flanvo:
 * - Score base: 50 punti
 * - Stesso corridoio geografico: +30 punti (se max dist da centroid ≤ 8km)
 * - Bagagli compatibili: +20 punti (se max 4 valigie per pax)
 * 
 * @param clusterSize - Numero passeggeri
 * @param metrics - Metriche passeggeri con coordinate destinazione
 * @param centroid - Centroide del cluster
 * @param luggageData - Array con info bagagli per passeggero
 * @param destinations - Coordinate destinazioni per calcolo distanza
 * @returns Score 0-100
 */
export function calculateCompatibility(
  clusterSize: number,
  metrics: PassengerMetrics[],
  centroid: { lat: number; lng: number },
  luggageData?: Array<{ bookingId: string; luggageCount: number }>,
  destinations?: Array<{ bookingId: string; lat: number; lng: number }>
): number {
  let score = 50; // Base score
  
  // 1. STESSO CORRIDOIO GEOGRAFICO (+30 punti)
  // Tutti i passeggeri devono essere entro 8km dal centroid
  if (destinations && destinations.length > 0) {
    // Importa haversineDistance
    const { haversineDistance } = require('./dbscan-clustering');
    
    // Calcola distanza reale in km dal centroid per ogni destinazione
    const distancesFromCentroid = destinations.map(dest => 
      haversineDistance(
        centroid.lat,
        centroid.lng,
        dest.lat,
        dest.lng
      )
    );
    
    const maxDistanceKm = Math.max(...distancesFromCentroid);
    
    // Bonus se tutte le destinazioni sono entro 8km dal centroid
    if (maxDistanceKm <= 8) {
      score += 30; // ✅ Pieno bonus
    } else if (maxDistanceKm <= 12) {
      // Parziale: proporzionale tra 8-12km
      const reduction = ((maxDistanceKm - 8) / 4) * 30;
      score += Math.round(30 - reduction);
    }
    // Oltre 12km: no bonus
    
  } else if (metrics.length > 0) {
    // Fallback: se non abbiamo coordinate, usa detourPercent come proxy
    // Questo è meno preciso ma funziona
    const maxDetour = Math.max(...metrics.map(m => m.detourPercent));
    
    if (maxDetour <= 10) {
      score += 30;
    } else if (maxDetour <= 20) {
      score += Math.round(30 * (1 - (maxDetour - 10) / 10));
    }
  }
  
  // 2. BAGAGLI COMPATIBILI (+20 punti)
  // Nessun passeggero deve avere più di 4 valigie
  if (luggageData && luggageData.length > 0) {
    const maxLuggage = Math.max(...luggageData.map(l => l.luggageCount));
    
    if (maxLuggage <= 4) {
      score += 20; // ✅ Pieno bonus
    } else if (maxLuggage <= 6) {
      // Parziale: proporzionale tra 4-6 valigie
      const reduction = ((maxLuggage - 4) / 2) * 20;
      score += Math.round(20 - reduction);
    }
    // Oltre 6 valigie: no bonus
    
  } else {
    // Se non abbiamo dati bagagli, assumiamo compatibili (benefit of doubt)
    score += 20;
  }
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Normalizza compatibility score da 0-100 a 0-10 per formula quality
 * 
 * @param compatibilityScore - Score 0-100
 * @returns Score 0-10
 */
function normalizeCompatibilityScore(compatibilityScore: number): number {
  return (compatibilityScore / 100) * 10;
}

/**
 * Determina stability tier del cluster
 * 
 * @param clusterSize - Numero passeggeri
 * @param metrics - Metriche passeggeri
 * @returns Stability tier
 */
export function determineStabilityTier(
  clusterSize: number,
  metrics: PassengerMetrics[]
): StabilityTier {
  // EXCELLENT: ≥3 pax
  if (clusterSize >= 3) {
    return 'EXCELLENT';
  }
  
  // GOOD: 2 pax con detour ≤10% e time ≤6min
  if (clusterSize === 2) {
    const maxDetour = Math.max(...metrics.map(m => m.detourPercent));
    const maxExtraTime = Math.max(...metrics.map(m => m.extraTimeMinutes));
    
    if (maxDetour <= 10 && maxExtraTime <= 6) {
      return 'GOOD';
    }
  }
  
  // REJECTED: 2 pax con qualità bassa o cluster singolo
  return 'REJECTED';
}

/**
 * Valida constraints business per il cluster
 * 
 * @param clusterSize - Numero passeggeri
 * @param metrics - Metriche passeggeri
 * @returns Validazione e warnings
 */
export function validateConstraints(
  clusterSize: number,
  metrics: PassengerMetrics[]
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Vincolo: cluster < 2 pax → NO MATCH
  if (clusterSize < 2) {
    warnings.push('❌ Cluster size < 2: not valid for matching');
    return { valid: false, warnings };
  }
  
  // Vincolo: cluster > 7 pax → SPLIT
  if (clusterSize > 7) {
    warnings.push('⚠️ Cluster size > 7: should be split into smaller groups');
  }
  
  // Pool da 2 pax: detour ≤ 10% e time ≤ 6 min
  if (clusterSize === 2) {
    for (const m of metrics) {
      if (m.detourPercent > 10) {
        warnings.push(`⚠️ ${m.bookingId}: detour ${m.detourPercent.toFixed(1)}% > 10% (2-pax limit)`);
      }
      if (m.extraTimeMinutes > 6) {
        warnings.push(`⚠️ ${m.bookingId}: extra time ${m.extraTimeMinutes.toFixed(1)}min > 6min (2-pax limit)`);
      }
    }
  }
  
  // Detour massimo generale: 20%
  for (const m of metrics) {
    if (m.detourPercent > 20) {
      warnings.push(`❌ ${m.bookingId}: detour ${m.detourPercent.toFixed(1)}% > 20% (hard limit)`);
    }
    if (m.extraTimeMinutes > 10) {
      warnings.push(`❌ ${m.bookingId}: extra time ${m.extraTimeMinutes.toFixed(1)}min > 10min (hard limit)`);
    }
  }
  
  // Valid se no hard limits violati
  const hasHardViolations = warnings.some(w => w.startsWith('❌'));
  
  return {
    valid: !hasHardViolations && clusterSize >= 2,
    warnings
  };
}

/**
 * Calcola quality score completo per un cluster
 * Formula: 40% saving + 30% time + 20% detour + 10% compatibility
 * 
 * @param input - Dati del cluster
 * @returns Quality score dettagliato
 */
export function calculateQualityScore(input: ClusterQualityInput): QualityScore {
  // Calcola score componenti
  const priceSaving = Math.round(scorePriceSaving(input.savings) * 10) / 10;
  const timeEfficiency = Math.round(scoreTimeEfficiency(input.metrics) * 10) / 10;
  const routeDeviation = Math.round(scoreRouteDeviation(input.metrics) * 10) / 10;
  
  // NUOVA LOGICA COMPATIBILITÀ con destinazioni reali
  const compatibilityScore = calculateCompatibility(
    input.clusterSize,
    input.metrics,
    input.centroid,
    input.luggageData,
    input.destinations // ✅ PASSA destinazioni per calcolo corridoio
  );
  const compatibility = Math.round(normalizeCompatibilityScore(compatibilityScore) * 10) / 10;
  
  // Score totale con formula 40/30/20/10
  const overall = Math.round((priceSaving + timeEfficiency + routeDeviation + compatibility) * 10) / 10;
  
  // Stability tier
  const stabilityTier = determineStabilityTier(input.clusterSize, input.metrics);
  
  // Validazione
  const validation = validateConstraints(input.clusterSize, input.metrics);
  
  // Recommendation
  let recommendation = '';
  if (!validation.valid) {
    recommendation = '❌ REJECT - Constraints violated';
  } else if (overall >= 80) {
    recommendation = '✅ EXCELLENT MATCH - Highly recommended';
  } else if (overall >= 60) {
    recommendation = '👍 GOOD MATCH - Recommended';
  } else if (overall >= 40) {
    recommendation = '⚠️ FAIR MATCH - Consider alternatives';
  } else {
    recommendation = '❌ POOR MATCH - Not recommended';
  }
  
  return {
    overall,
    breakdown: {
      priceSaving,
      timeEfficiency,
      routeDeviation,
      compatibility
    },
    stabilityTier,
    recommendation,
    warnings: validation.warnings
  };
}

/**
 * Genera quality report leggibile
 */
export function generateQualityReport(score: QualityScore): string {
  const lines = [
    `📊 Quality Score: ${score.overall}/100`,
    `🎯 Stability Tier: ${score.stabilityTier}`,
    ``,
    `Breakdown:`,
    `  💰 Price Saving:    ${score.breakdown.priceSaving}/40`,
    `  ⏱️  Time Efficiency: ${score.breakdown.timeEfficiency}/30`,
    `  🛣️  Route Deviation: ${score.breakdown.routeDeviation}/20`,
    `  🤝 Compatibility:   ${score.breakdown.compatibility}/10`,
    ``,
    `${score.recommendation}`
  ];
  
  if (score.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    score.warnings.forEach(w => lines.push(`  ${w}`));
  }
  
  return lines.join('\n');
}

/**
 * Confronta due cluster e raccomanda il migliore
 */
export function compareClusterQualities(
  scoreA: QualityScore,
  scoreB: QualityScore
): { better: 'A' | 'B' | 'TIE'; reason: string } {
  // Se uno è rejected e l'altro no → vince il valido
  const aValid = !scoreA.recommendation.startsWith('❌ REJECT');
  const bValid = !scoreB.recommendation.startsWith('❌ REJECT');
  
  if (aValid && !bValid) return { better: 'A', reason: 'Cluster B violates constraints' };
  if (!aValid && bValid) return { better: 'B', reason: 'Cluster A violates constraints' };
  if (!aValid && !bValid) return { better: 'TIE', reason: 'Both clusters rejected' };
  
  // Entrambi validi → confronta stability tier
  const tierRank = { EXCELLENT: 3, GOOD: 2, REJECTED: 1 };
  const aTier = tierRank[scoreA.stabilityTier];
  const bTier = tierRank[scoreB.stabilityTier];
  
  if (aTier > bTier) return { better: 'A', reason: `Better stability (${scoreA.stabilityTier} vs ${scoreB.stabilityTier})` };
  if (bTier > aTier) return { better: 'B', reason: `Better stability (${scoreB.stabilityTier} vs ${scoreA.stabilityTier})` };
  
  // Stesso tier → confronta overall score
  const diff = scoreA.overall - scoreB.overall;
  if (Math.abs(diff) < 5) return { better: 'TIE', reason: 'Scores are very similar' };
  
  return diff > 0
    ? { better: 'A', reason: `Higher quality score (${scoreA.overall} vs ${scoreB.overall})` }
    : { better: 'B', reason: `Higher quality score (${scoreB.overall} vs ${scoreA.overall})` };
}

/**
 * Test case example
 */
export function testQualityScorer(): void {
  console.log('=== Flanvo Quality Scorer Test ===\n');
  
 // Test case: 3-passenger cluster con buone metriche
const input: ClusterQualityInput = {
  clusterSize: 3,
  metrics: [
    { bookingId: 'BK001', kmOnboard: 25, directDistance: 23, detourPercent: 8.7, extraTimeMinutes: 4.2, pickupIndex: 1, dropoffIndex: 4 },
    { bookingId: 'BK002', kmOnboard: 20, directDistance: 19, detourPercent: 5.3, extraTimeMinutes: 2.8, pickupIndex: 2, dropoffIndex: 5 },
    { bookingId: 'BK003', kmOnboard: 15, directDistance: 14, detourPercent: 7.1, extraTimeMinutes: 3.5, pickupIndex: 3, dropoffIndex: 6 }
  ],
  savings: [
    { bookingId: 'BK001', savingsPercent: 35.5 },
    { bookingId: 'BK002', savingsPercent: 38.2 },
    { bookingId: 'BK003', savingsPercent: 32.8 }
  ],
  totalRouteKm: 60,
  averageDetourPercent: 7.0,
  averageExtraTimeMinutes: 3.5,
  
  // ✅ AGGIUNGI QUESTI DUE CAMPI:
  centroid: { lat: 45.464, lng: 9.190 },
  destinations: [
    { bookingId: 'BK001', lat: 45.4642, lng: 9.1900 },
    { bookingId: 'BK002', lat: 45.4650, lng: 9.1910 },
    { bookingId: 'BK003', lat: 45.4635, lng: 9.1895 }
  ]
};

const score = calculateQualityScore(input);
console.log(generateQualityReport(score));
} 