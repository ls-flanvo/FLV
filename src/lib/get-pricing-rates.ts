import { prisma } from './prisma';

export interface PricingRates {
  driverRatePerKm: number;
  flanvoTier1Rate: number; // €/km per 0-50 km
  flanvoTier2Rate: number; // €/km per 51-99 km
  flanvoTier3Rate: number; // €/km per ≥100 km
  protectionFee: number;  // € fissi per passeggero
}

const DEFAULTS: PricingRates = {
  driverRatePerKm: 2.0,
  flanvoTier1Rate: 0.30,
  flanvoTier2Rate: 0.25,
  flanvoTier3Rate: 0.20,
  protectionFee: 2.50,
};

export async function getPricingRates(): Promise<PricingRates> {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'driver_rate_per_km',
            'flanvo_tier1_rate',
            'flanvo_tier2_rate',
            'flanvo_tier3_rate',
            'protection_fee',
          ],
        },
      },
    });

    const map: Record<string, number> = {};
    for (const c of configs) {
      map[c.key] = parseFloat(c.value);
    }

    return {
      driverRatePerKm: map['driver_rate_per_km'] ?? DEFAULTS.driverRatePerKm,
      flanvoTier1Rate: map['flanvo_tier1_rate'] ?? DEFAULTS.flanvoTier1Rate,
      flanvoTier2Rate: map['flanvo_tier2_rate'] ?? DEFAULTS.flanvoTier2Rate,
      flanvoTier3Rate: map['flanvo_tier3_rate'] ?? DEFAULTS.flanvoTier3Rate,
      protectionFee: map['protection_fee'] ?? DEFAULTS.protectionFee,
    };
  } catch {
    return DEFAULTS;
  }
}
