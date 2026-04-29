import { describe, it, expect } from 'vitest';

// Logica pricing estratta inline per testare senza Prisma
function calculateFlanvoRate(km: number, tier1: number, tier2: number, tier3: number): number {
  if (km < 50) return tier1;
  if (km < 100) return tier2;
  return tier3;
}

function calculatePassengerPrice(
  kmOnboard: number,
  groupSize: number,
  driverRatePerKm: number,
  flanvoRate: number,
  protectionFee: number,
): { driverShare: number; flanvoFee: number; total: number } {
  const driverShare = kmOnboard * driverRatePerKm / groupSize;
  const flanvoFee = kmOnboard * flanvoRate / groupSize;
  const total = driverShare + flanvoFee + protectionFee;
  return {
    driverShare: Math.round(driverShare * 100) / 100,
    flanvoFee: Math.round(flanvoFee * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

describe('Flanvo pricing tiers', () => {
  it('uses tier1 (0.30€) for routes under 50km', () => {
    expect(calculateFlanvoRate(30, 0.30, 0.25, 0.20)).toBe(0.30);
  });

  it('uses tier2 (0.25€) for routes 50-99km', () => {
    expect(calculateFlanvoRate(70, 0.30, 0.25, 0.20)).toBe(0.25);
  });

  it('uses tier3 (0.20€) for routes 100km+', () => {
    expect(calculateFlanvoRate(150, 0.30, 0.25, 0.20)).toBe(0.20);
  });
});

describe('Passenger price calculation', () => {
  const defaults = { driverRate: 2.0, flanvoRate: 0.30, protection: 2.50 };

  it('single passenger pays full route cost', () => {
    const { driverShare, total } = calculatePassengerPrice(20, 1, defaults.driverRate, defaults.flanvoRate, defaults.protection);
    expect(driverShare).toBe(40.00); // 20km * 2€ / 1 pax
    expect(total).toBe(48.50); // 40 + 6 + 2.50
  });

  it('price splits evenly across group', () => {
    const solo = calculatePassengerPrice(20, 1, defaults.driverRate, defaults.flanvoRate, defaults.protection);
    const duo = calculatePassengerPrice(20, 2, defaults.driverRate, defaults.flanvoRate, defaults.protection);
    // Each pax in duo pays roughly half driver share (protection fee not split)
    expect(duo.driverShare).toBe(solo.driverShare / 2);
  });

  it('group of 3 is cheaper than group of 2', () => {
    const twoP = calculatePassengerPrice(30, 2, defaults.driverRate, defaults.flanvoRate, defaults.protection);
    const threeP = calculatePassengerPrice(30, 3, defaults.driverRate, defaults.flanvoRate, defaults.protection);
    expect(threeP.total).toBeLessThan(twoP.total);
  });

  it('total is always positive', () => {
    const { total } = calculatePassengerPrice(5, 7, defaults.driverRate, defaults.flanvoRate, defaults.protection);
    expect(total).toBeGreaterThan(0);
  });
});

describe('Savings vs taxi', () => {
  const TAXI_RATE_PER_KM = 2.5; // Media taxi CTA→palermo

  it('group of 3 saves at least 50% vs taxi', () => {
    const km = 25;
    const taxiCost = km * TAXI_RATE_PER_KM;
    const flanvoCost = calculatePassengerPrice(km, 3, 2.0, 0.30, 2.50).total;
    const savings = (taxiCost - flanvoCost) / taxiCost;
    expect(savings).toBeGreaterThan(0.50);
  });
});
