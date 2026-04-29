import { describe, it, expect } from 'vitest';
import { formatFlightTime, formatDelay, formatCountdown, minutesUntil } from '@/lib/time';

describe('formatFlightTime', () => {
  it('returns — for null input', () => {
    expect(formatFlightTime(null)).toBe('—');
    expect(formatFlightTime(undefined)).toBe('—');
  });

  it('returns — for invalid date', () => {
    expect(formatFlightTime('not-a-date')).toBe('—');
  });

  it('returns HH:MM for valid ISO string', () => {
    const result = formatFlightTime('2026-05-15T10:30:00Z');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('includes date when showDate is true', () => {
    const result = formatFlightTime('2026-05-15T10:30:00Z', { showDate: true });
    expect(result).toContain('·');
  });
});

describe('formatDelay', () => {
  it('returns null for delays under 5 min', () => {
    expect(formatDelay(0)).toBeNull();
    expect(formatDelay(4)).toBeNull();
    expect(formatDelay(null)).toBeNull();
  });

  it('formats minutes correctly', () => {
    expect(formatDelay(15)).toBe('+15 min');
    expect(formatDelay(45)).toBe('+45 min');
  });

  it('formats hours correctly', () => {
    expect(formatDelay(60)).toBe('+1h');
    expect(formatDelay(90)).toBe('+1h 30m');
    expect(formatDelay(120)).toBe('+2h');
  });
});

describe('minutesUntil', () => {
  it('returns null for null/undefined input', () => {
    expect(minutesUntil(null)).toBeNull();
    expect(minutesUntil(undefined)).toBeNull();
  });

  it('returns positive number for future dates', () => {
    const future = new Date(Date.now() + 2 * 60 * 60_000).toISOString();
    const result = minutesUntil(future);
    expect(result).toBeGreaterThan(100);
    expect(result).toBeLessThan(130);
  });

  it('returns negative number for past dates', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(minutesUntil(past)).toBeLessThan(0);
  });
});

describe('formatCountdown', () => {
  it('returns — for null', () => {
    expect(formatCountdown(null)).toBe('—');
  });

  it('returns Passato for past dates', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(formatCountdown(past)).toBe('Passato');
  });

  it('formats minutes under 1h', () => {
    const soon = new Date(Date.now() + 30 * 60_000).toISOString();
    expect(formatCountdown(soon)).toMatch(/tra \d+ min/);
  });

  it('formats hours and minutes', () => {
    const later = new Date(Date.now() + 90 * 60_000).toISOString();
    expect(formatCountdown(later)).toMatch(/tra 1h 30m/);
  });

  it('formats exact hours', () => {
    const twoH = new Date(Date.now() + 120 * 60_000).toISOString();
    expect(formatCountdown(twoH)).toMatch(/tra 2h$/);
  });
});
