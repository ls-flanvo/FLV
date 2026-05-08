import { prisma } from './prisma';

export interface PricingRates {
  driverRatePerKm: number;
  driverBonusPerPax: number;   // Bonus fisso per passeggero (incentivo gruppo pieno)
  flanvoTier1Rate: number;
  flanvoTier2Rate: number;
  flanvoTier3Rate: number;
  protectionFee: number;
  matchingWindowHours: number; // Ore prima del volo entro cui chiudere il gruppo
  paymentWindowMinutes: number; // Minuti per pagare dopo chiusura gruppo
}

const DEFAULTS: PricingRates = {
  driverRatePerKm: 2.0,
  driverBonusPerPax: 3.50,     // €3.50 per passeggero → allinea incentivi driver/Flanvo/pax
  flanvoTier1Rate: 0.30,       // ≤50km
  flanvoTier2Rate: 0.25,       // 51-100km
  flanvoTier3Rate: 0.20,       // >100km
  protectionFee: 1.00,         // Ridotta da €2.50 — €1.50 spostati nel bonus driver
  matchingWindowHours: 3,
  paymentWindowMinutes: 30,
};

export async function getPricingRates(): Promise<PricingRates> {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['driver_rate_per_km', 'flanvo_tier1_rate', 'flanvo_tier2_rate', 'flanvo_tier3_rate', 'protection_fee', 'matching_window_hours'],
        },
      },
    });

    const map: Record<string, number> = {};
    for (const c of configs) map[c.key] = parseFloat(c.value);

    return {
      driverRatePerKm: map['driver_rate_per_km'] ?? DEFAULTS.driverRatePerKm,
      driverBonusPerPax: map['driver_bonus_per_pax'] ?? DEFAULTS.driverBonusPerPax,
      flanvoTier1Rate: map['flanvo_tier1_rate'] ?? DEFAULTS.flanvoTier1Rate,
      flanvoTier2Rate: map['flanvo_tier2_rate'] ?? DEFAULTS.flanvoTier2Rate,
      flanvoTier3Rate: map['flanvo_tier3_rate'] ?? DEFAULTS.flanvoTier3Rate,
      protectionFee: map['protection_fee'] ?? DEFAULTS.protectionFee,
      matchingWindowHours: map['matching_window_hours'] ?? DEFAULTS.matchingWindowHours,
      paymentWindowMinutes: map['payment_window_minutes'] ?? DEFAULTS.paymentWindowMinutes,
    };
  } catch {
    return DEFAULTS;
  }
}
