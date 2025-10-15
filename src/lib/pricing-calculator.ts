/**
 * Pricing Calculator for Flanvo Ride-Sharing
 * Calcola tariffe proporzionali per passeggeri con modello tiered
 * 
 * @module pricing-calculator
 */

const DRIVER_RATE = 2.0; // €/km

/**
 * Tariffe Flanvo tiered per km
 */
const FLANVO_TIERS = [
  { minKm: 0, maxKm: 50, rate: 0.30 },   // 0-50 km → 0.30 €/km
  { minKm: 51, maxKm: 99, rate: 0.25 },  // 51-99 km → 0.25 €/km
  { minKm: 100, maxKm: Infinity, rate: 0.20 } // ≥100 km → 0.20 €/km
];

export interface PassengerPricing {
  bookingId: string;
  kmOnboard: number;
  driverCost: number; // Quota driver cost (2€/km)
  flanvoFee: number; // Quota Flanvo fee (tiered)
  totalPrice: number; // Totale passeggero
  sharePercent: number; // % del totale route
  breakdown: {
    driverRate: number;
    flanvoRate: number;
    originalTotal: number; // Prima di penny adjustment
    pennyAdjustment: number; // ±0.01
  };
}

export interface ClusterPricing {
  totalRouteKm: number;
  totalDriverCost: number;
  totalFlanvoFee: number;
  grandTotal: number;
  passengers: PassengerPricing[];
  validation: {
    sumMatchesTotal: boolean;
    difference: number; // Dovrebbe essere 0
  };
}

/**
 * Determina la tariffa Flanvo in base ai km onboard
 * 
 * @param kmOnboard - Km percorsi dal passeggero
 * @returns Tariffa €/km applicabile
 */
export function getFlanvoRate(kmOnboard: number): number {
  for (const tier of FLANVO_TIERS) {
    if (kmOnboard >= tier.minKm && kmOnboard <= tier.maxKm) {
      return tier.rate;
    }
  }
  
  // Fallback: ultima tier
  return FLANVO_TIERS[FLANVO_TIERS.length - 1].rate;
}

/**
 * Calcola pricing per un singolo passeggero
 * ✅ MODELLO EQUO: Driver cost diviso equamente, Flanvo fee proporzionale
 * 
 * @param bookingId - ID del booking
 * @param kmOnboard - Km percorsi dal passeggero
 * @param totalRouteKm - Km totali del route
 * @param totalPassengers - Numero totale passeggeri nel cluster
 * @returns Pricing breakdown
 */
function calculatePassengerPricing(
  bookingId: string,
  kmOnboard: number,
  totalRouteKm: number,
  totalPassengers: number
): Omit<PassengerPricing, 'breakdown'> & { breakdown: Omit<PassengerPricing['breakdown'], 'pennyAdjustment'> } {
  // Percentuale di route percorsa dal passeggero (per info, non per pricing)
  const sharePercent = (kmOnboard / totalRouteKm) * 100;
  
  // ✅ DRIVER COST EQUO: costo totale veicolo diviso tra tutti
  const totalVehicleCost = totalRouteKm * DRIVER_RATE;
  const driverCost = totalVehicleCost / totalPassengers;
  
  // ✅ FLANVO FEE PROPORZIONALE: basata sui km effettivi del passeggero
  const flanvoRate = getFlanvoRate(kmOnboard);
  const flanvoFee = kmOnboard * flanvoRate;
  
  // Totale (arrotondato a 2 decimali)
  const totalPrice = Math.round((driverCost + flanvoFee) * 100) / 100;
  
  return {
    bookingId,
    kmOnboard: Math.round(kmOnboard * 100) / 100,
    driverCost: Math.round(driverCost * 100) / 100,
    flanvoFee: Math.round(flanvoFee * 100) / 100,
    totalPrice,
    sharePercent: Math.round(sharePercent * 100) / 100,
    breakdown: {
      driverRate: DRIVER_RATE,
      flanvoRate,
      originalTotal: totalPrice
    }
  };
}

/**
 * Applica penny adjustment per garantire che la somma sia esatta
 * Aggiunge o sottrae 0.01€ al primo passeggero
 * 
 * @param passengers - Array di pricing passeggeri
 * @param expectedTotal - Totale atteso (driver + flanvo)
 * @returns Passengers con adjustment applicato
 */
export function applyPennyAdjustment(
  passengers: Array<Omit<PassengerPricing, 'breakdown'> & { 
    breakdown: Omit<PassengerPricing['breakdown'], 'pennyAdjustment'> 
  }>,
  expectedTotal: number
): PassengerPricing[] {
  if (passengers.length === 0) {
    return [];
  }
  
  // Calcola somma attuale
  const currentSum = passengers.reduce((sum, p) => sum + p.totalPrice, 0);
  const roundedSum = Math.round(currentSum * 100) / 100;
  const roundedExpected = Math.round(expectedTotal * 100) / 100;
  
  // Differenza in centesimi
  const diffCents = Math.round((roundedExpected - roundedSum) * 100);
  
  // Applica adjustment al primo passeggero
  const adjusted: PassengerPricing[] = passengers.map((p, idx) => {
    if (idx === 0 && diffCents !== 0) {
      const adjustment = diffCents / 100;
      return {
        ...p,
        totalPrice: Math.round((p.totalPrice + adjustment) * 100) / 100,
        breakdown: {
          ...p.breakdown,
          pennyAdjustment: Math.round(adjustment * 100) / 100
        }
      };
    }
    
    return {
      ...p,
      breakdown: {
        ...p.breakdown,
        pennyAdjustment: 0
      }
    };
  });
  
  return adjusted;
}

/**
 * Calcola pricing completo per un cluster
 * ✅ MODELLO EQUO: Driver cost diviso equamente tra tutti
 * 
 * @param totalRouteKm - Km totali del route ottimizzato
 * @param passengerKm - Array di { bookingId, kmOnboard }
 * @returns Pricing breakdown completo
 */
export function calculatePricing(
  totalRouteKm: number,
  passengerKm: Array<{ bookingId: string; kmOnboard: number }>
): ClusterPricing {
  if (passengerKm.length === 0) {
    throw new Error('No passengers provided for pricing');
  }
  
  const totalPassengers = passengerKm.length;
  
  // Calcola pricing individuale (senza adjustment)
  // ✅ PASSA totalPassengers per split equo del driver cost
  const passengersBase = passengerKm.map(pk =>
    calculatePassengerPricing(pk.bookingId, pk.kmOnboard, totalRouteKm, totalPassengers)
  );
  
  // Calcola totali attesi
  const totalDriverCost = totalRouteKm * DRIVER_RATE;
  const totalFlanvoFee = passengerKm.reduce((sum, pk) => {
    const rate = getFlanvoRate(pk.kmOnboard);
    return sum + (pk.kmOnboard * rate);
  }, 0);
  
  const grandTotal = totalDriverCost + totalFlanvoFee;
  
  // Applica penny adjustment
  const passengers = applyPennyAdjustment(passengersBase, grandTotal);
  
  // Validazione finale
  const actualSum = passengers.reduce((sum, p) => sum + p.totalPrice, 0);
  const roundedActualSum = Math.round(actualSum * 100) / 100;
  const roundedGrandTotal = Math.round(grandTotal * 100) / 100;
  const difference = Math.abs(roundedGrandTotal - roundedActualSum);
  
  return {
    totalRouteKm: Math.round(totalRouteKm * 100) / 100,
    totalDriverCost: Math.round(totalDriverCost * 100) / 100,
    totalFlanvoFee: Math.round(totalFlanvoFee * 100) / 100,
    grandTotal: roundedGrandTotal,
    passengers,
    validation: {
      sumMatchesTotal: difference < 0.01,
      difference: Math.round(difference * 100) / 100
    }
  };
}

/**
 * Calcola risparmio per ogni passeggero rispetto a viaggio solo
 * 
 * @param clusterPricing - Pricing del cluster
 * @param soloRates - Tariffe viaggio solo per confronto
 * @returns Array con saving per passeggero
 */
export function calculateSavings(
  clusterPricing: ClusterPricing,
  soloRates: Array<{ bookingId: string; soloPrice: number }>
): Array<{ bookingId: string; poolPrice: number; soloPrice: number; savings: number; savingsPercent: number }> {
  return clusterPricing.passengers.map(p => {
    const solo = soloRates.find(s => s.bookingId === p.bookingId);
    
    if (!solo) {
      throw new Error(`Solo rate not found for booking ${p.bookingId}`);
    }
    
    const savings = solo.soloPrice - p.totalPrice;
    const savingsPercent = (savings / solo.soloPrice) * 100;
    
    return {
      bookingId: p.bookingId,
      poolPrice: p.totalPrice,
      soloPrice: solo.soloPrice,
      savings: Math.round(savings * 100) / 100,
      savingsPercent: Math.round(savingsPercent * 100) / 100
    };
  });
}

/**
 * Genera pricing summary per UI
 */
export function generatePricingSummary(pricing: ClusterPricing): string {
  const lines = [
    `🚗 Route Totale: ${pricing.totalRouteKm} km`,
    `💰 Driver Cost: €${pricing.totalDriverCost.toFixed(2)}`,
    `🎯 Flanvo Fee: €${pricing.totalFlanvoFee.toFixed(2)}`,
    `📊 Grand Total: €${pricing.grandTotal.toFixed(2)}`,
    ``,
    `👥 Passengers (${pricing.passengers.length}):`,
    ...pricing.passengers.map(p => {
      const adj = p.breakdown.pennyAdjustment !== 0 
        ? ` (adj: ${p.breakdown.pennyAdjustment > 0 ? '+' : ''}€${p.breakdown.pennyAdjustment.toFixed(2)})`
        : '';
      return `  • ${p.bookingId}: ${p.kmOnboard}km → €${p.totalPrice.toFixed(2)} (${p.sharePercent}%)${adj}`;
    }),
    ``,
    `✅ Validation: ${pricing.validation.sumMatchesTotal ? 'PASS' : 'FAIL'}`
  ];
  
  if (!pricing.validation.sumMatchesTotal) {
    lines.push(`⚠️  Difference: €${pricing.validation.difference.toFixed(2)}`);
  }
  
  return lines.join('\n');
}

/**
 * Test case example con MODELLO EQUO
 */
export function testPricingCalculator(): void {
  console.log('=== Flanvo Pricing Calculator Test (MODELLO EQUO) ===\n');
  
  // Scenario: 5 passengers, route totale 40.5 km
  const totalRouteKm = 40.5;
  const totalPassengers = 5;
  
  const passengers = [
    { bookingId: 'Sara', kmOnboard: 35.0 },
    { bookingId: 'Lucia', kmOnboard: 40.5 },
    { bookingId: 'Marco', kmOnboard: 30.0 },
    { bookingId: 'Anna', kmOnboard: 38.0 },
    { bookingId: 'Paolo', kmOnboard: 32.5 }
  ];
  
  // Calcolo manuale per verifica:
  // Driver cost totale: 40.5 km × €2.00 = €81.00
  // Driver cost per passeggero: €81.00 ÷ 5 = €16.20 (EQUO per tutti)
  
  // Flanvo fees (proporzionali):
  // Sara: 35 km × €0.30 = €10.50 → Total: €26.70
  // Lucia: 40.5 km × €0.30 = €12.15 → Total: €28.35
  // Marco: 30 km × €0.30 = €9.00 → Total: €25.20
  // Anna: 38 km × €0.30 = €11.40 → Total: €27.60
  // Paolo: 32.5 km × €0.30 = €9.75 → Total: €25.95
  
  const pricing = calculatePricing(totalRouteKm, passengers);
  console.log(generatePricingSummary(pricing));
  
  console.log('\n✅ VERIFICA MODELLO EQUO:');
  console.log(`Driver cost per passeggero: €${(pricing.totalDriverCost / totalPassengers).toFixed(2)} (uguale per tutti)`);
  
  passengers.forEach(p => {
    const paxPricing = pricing.passengers.find(pp => pp.bookingId === p.bookingId)!;
    console.log(`\n${p.bookingId} (${p.kmOnboard} km a bordo):`);
    console.log(`  Driver: €${paxPricing.driverCost.toFixed(2)} (equo)`);
    console.log(`  Flanvo: €${paxPricing.flanvoFee.toFixed(2)} (proporzionale)`);
    console.log(`  TOTALE: €${paxPricing.totalPrice.toFixed(2)}`);
  });
  
  // Test savings rispetto a viaggio solo
  const soloRates = [
    { bookingId: 'Sara', soloPrice: 70.0 + 10.5 },     // 35km × 2.00 + fee
    { bookingId: 'Lucia', soloPrice: 81.0 + 12.15 },   // 40.5km × 2.00 + fee
    { bookingId: 'Marco', soloPrice: 60.0 + 9.0 },     // 30km × 2.00 + fee
    { bookingId: 'Anna', soloPrice: 76.0 + 11.4 },     // 38km × 2.00 + fee
    { bookingId: 'Paolo', soloPrice: 65.0 + 9.75 }     // 32.5km × 2.00 + fee
  ];
  
  const savings = calculateSavings(pricing, soloRates);
  console.log('\n💵 Savings vs Solo:');
  savings.forEach(s => {
    console.log(`  ${s.bookingId}: €${s.savings.toFixed(2)} saved (${s.savingsPercent.toFixed(1)}%)`);
  });
}