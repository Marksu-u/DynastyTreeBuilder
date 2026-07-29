import { describe, it, expect } from 'vitest';
import { crestFromSeed, TINCTURES, SHAPES, DIVISIONS, CHARGES } from './crest';

describe('crestFromSeed', () => {
  it('is deterministic', () => {
    expect(crestFromSeed('house-thorne')).toEqual(crestFromSeed('house-thorne'));
  });

  it('produces different crests for different seeds', () => {
    expect(crestFromSeed('house-thorne')).not.toEqual(crestFromSeed('house-ashfell'));
  });

  it('obeys the rule of tincture', () => {
    for (let i = 0; i < 500; i++) {
      const spec = crestFromSeed(`seed-${i}`);
      const chargeClass = TINCTURES[spec.chargeTincture].class;
      for (const field of spec.field) {
        expect(TINCTURES[field].class).not.toBe(chargeClass);
      }
      if (spec.field.length === 2) {
        expect(spec.field[0]).not.toBe(spec.field[1]);
        expect(TINCTURES[spec.field[0]].class).toBe('colour');
        expect(TINCTURES[spec.field[1]].class).toBe('colour');
      }
    }
  });

  it('spreads across the grammar', () => {
    const seen = { shape: new Set(), division: new Set(), charge: new Set() };
    const counts = new Map<string, number>();
    for (let i = 0; i < 500; i++) {
      const spec = crestFromSeed(`seed-${i}`);
      seen.shape.add(spec.shape);
      seen.division.add(spec.division);
      seen.charge.add(spec.charge);
      counts.set(spec.charge, (counts.get(spec.charge) ?? 0) + 1);
    }
    expect(seen.shape.size).toBe(SHAPES.length);
    expect(seen.division.size).toBe(DIVISIONS.length);
    expect(seen.charge.size).toBe(CHARGES.length);
    for (const n of counts.values()) expect(n).toBeLessThan(500 * 0.4);
  });

  it('is stable forever — these crests are baked into shared OG images', () => {
    // If this test fails, someone changed the seed → spec mapping and silently
    // rewrote the arms of already-shared houses.
    expect(crestFromSeed('house-thorne')).toEqual({
      shape: 'rounded',
      division: 'quarterly',
      field: ['gules', 'purpure'],
      charge: 'sun',
      arrangement: 'single',
      chargeTincture: 'or',
    });
  });
});
