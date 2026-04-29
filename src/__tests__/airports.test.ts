import { describe, it, expect } from 'vitest';
import { AIRPORT_COORDS } from '@/lib/airports';

describe('Airport data', () => {
  it('has at least 8 airports', () => {
    expect(Object.keys(AIRPORT_COORDS).length).toBeGreaterThanOrEqual(8);
  });

  it('all airports have required fields', () => {
    for (const [code, a] of Object.entries(AIRPORT_COORDS)) {
      expect(code).toMatch(/^[A-Z]{3}$/, `${code} deve essere IATA 3 lettere`);
      expect(a.name).toBeTruthy();
      expect(typeof a.lat).toBe('number');
      expect(typeof a.lng).toBe('number');
      expect(a.meetingPoint).toBeTruthy();
    }
  });

  it('CTA (Catania) exists and has realistic coordinates', () => {
    const cta = AIRPORT_COORDS['CTA'];
    expect(cta).toBeDefined();
    expect(cta.name).toContain('Catania');
    // Catania: ~37.47°N, 15.07°E
    expect(cta.lat).toBeCloseTo(37.47, 0);
    expect(cta.lng).toBeCloseTo(15.07, 0);
  });

  it('PMO (Palermo) exists', () => {
    expect(AIRPORT_COORDS['PMO']).toBeDefined();
  });

  it('all coordinates are valid geo coordinates', () => {
    for (const [code, a] of Object.entries(AIRPORT_COORDS)) {
      expect(a.lat).toBeGreaterThanOrEqual(-90);
      expect(a.lat).toBeLessThanOrEqual(90);
      expect(a.lng).toBeGreaterThanOrEqual(-180);
      expect(a.lng).toBeLessThanOrEqual(180);
    }
  });

  it('all meeting points reference Flanvo', () => {
    for (const [code, a] of Object.entries(AIRPORT_COORDS)) {
      expect(a.meetingPoint.toLowerCase()).toContain('flanvo');
    }
  });
});
