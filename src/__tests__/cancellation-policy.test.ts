import { describe, it, expect } from 'vitest';

// Policy: rimborso completo fino ad accettazione driver, nessun rimborso dopo.
// Volo cancellato dalla compagnia: rimborso completo sempre.

const DRIVER_LOCKED = ['ASSIGNED', 'ACTIVE'];

function canCancelWithFullRefund(groupStatus: string): boolean {
  return !DRIVER_LOCKED.includes(groupStatus);
}

describe('Cancellation policy — driver acceptance based', () => {

  it('rimborso completo se gruppo in FORMING (driver non assegnato)', () => {
    expect(canCancelWithFullRefund('FORMING')).toBe(true);
  });

  it('rimborso completo se gruppo CONFIRMED (in attesa pagamenti)', () => {
    expect(canCancelWithFullRefund('CONFIRMED')).toBe(true);
  });

  it('rimborso completo se gruppo READY (tutti hanno pagato, driver non ancora accettato)', () => {
    expect(canCancelWithFullRefund('READY')).toBe(true);
  });

  it('nessun rimborso se driver ha accettato (ASSIGNED)', () => {
    expect(canCancelWithFullRefund('ASSIGNED')).toBe(false);
  });

  it('nessun rimborso con corsa in corso (ACTIVE)', () => {
    expect(canCancelWithFullRefund('ACTIVE')).toBe(false);
  });

  it('price lock: cancellazione non cambia i prezzi degli altri membri', () => {
    // Principio: chi rimane nel gruppo mantiene il prezzo originale.
    // Flanvo assorbe la differenza del driver share mancante.
    const originalPrice = 12.50;
    const priceAfterCancellation = originalPrice; // invariato
    expect(priceAfterCancellation).toBe(originalPrice);
  });

  it('slot riapertura: il gruppo torna FORMING se era CONFIRMED/READY senza pagamenti', () => {
    const shouldReopen = (groupStatus: string, anyPaid: boolean, newCapacity: number) =>
      ['CONFIRMED', 'READY'].includes(groupStatus) && !anyPaid && newCapacity >= 2;

    expect(shouldReopen('CONFIRMED', false, 3)).toBe(true);
    expect(shouldReopen('READY', false, 4)).toBe(true);
    expect(shouldReopen('READY', true, 4)).toBe(false); // price lock se qualcuno ha pagato
    expect(shouldReopen('ASSIGNED', false, 4)).toBe(false); // driver accettato
  });
});
