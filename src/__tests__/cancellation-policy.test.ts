import { describe, it, expect } from 'vitest';

// Policy B: >24h = 100% refund, 12-24h = 50%, <12h = 0%
function getRefundPolicy(flightTime: Date, cancelTime: Date): { percent: number; eligible: boolean } {
  const hoursUntilFlight = (flightTime.getTime() - cancelTime.getTime()) / (1000 * 60 * 60);

  if (hoursUntilFlight > 24) return { percent: 100, eligible: true };
  if (hoursUntilFlight > 12) return { percent: 50, eligible: true };
  return { percent: 0, eligible: false };
}

describe('Cancellation Policy B', () => {
  const flight = new Date('2026-06-01T14:00:00Z');

  it('100% refund when cancelling >24h before flight', () => {
    const cancel = new Date('2026-05-30T10:00:00Z'); // 52h before
    const { percent, eligible } = getRefundPolicy(flight, cancel);
    expect(percent).toBe(100);
    expect(eligible).toBe(true);
  });

  it('50% refund when cancelling 12-24h before flight', () => {
    const cancel = new Date('2026-06-01T01:00:00Z'); // 13h before
    const { percent, eligible } = getRefundPolicy(flight, cancel);
    expect(percent).toBe(50);
    expect(eligible).toBe(true);
  });

  it('0% refund when cancelling <12h before flight', () => {
    const cancel = new Date('2026-06-01T06:00:00Z'); // 8h before
    const { percent, eligible } = getRefundPolicy(flight, cancel);
    expect(percent).toBe(0);
    expect(eligible).toBe(false);
  });

  it('edge: exactly 24h is still 100% refund', () => {
    const cancel = new Date(flight.getTime() - 24 * 60 * 60 * 1000 - 1000);
    const { percent } = getRefundPolicy(flight, cancel);
    expect(percent).toBe(100);
  });

  it('edge: exactly 12h is 50% refund', () => {
    const cancel = new Date(flight.getTime() - 12 * 60 * 60 * 1000 - 1000);
    const { percent } = getRefundPolicy(flight, cancel);
    expect(percent).toBe(50);
  });
});
