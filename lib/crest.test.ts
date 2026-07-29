import { describe, it, expect } from 'vitest';
import {
  crestFromSeed, TINCTURES, SHAPES, DIVISIONS, CHARGES, crestToSvg,
  resolveCrestSeed, crestCacheKey, randomCrestSeed,
} from './crest';

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

describe('crestToSvg', () => {
  it('emits a well-formed standalone svg', () => {
    const svg = crestToSvg(crestFromSeed('house-thorne'), 64);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('width="64"');
    expect(svg).toContain('viewBox="0 0 60 72"');
  });

  it('never emits NaN or undefined', () => {
    for (let i = 0; i < 500; i++) {
      const svg = crestToSvg(crestFromSeed(`seed-${i}`), 48);
      expect(svg).not.toContain('NaN');
      expect(svg).not.toContain('undefined');
    }
  });

  it('renders every charge and every division without throwing', () => {
    for (const charge of CHARGES) {
      for (const division of DIVISIONS) {
        const spec = { ...crestFromSeed('base'), charge, division,
          field: division === 'plain'
            ? (['azure'] as ['azure'])
            : (['azure', 'gules'] as ['azure', 'gules']),
          chargeTincture: 'or' as const };
        expect(() => crestToSvg(spec, 40)).not.toThrow();
      }
    }
  });

  it('gives each instance unique clip ids so multiple crests can coexist in one document', () => {
    const a = crestToSvg(crestFromSeed('house-a'), 40);
    const b = crestToSvg(crestFromSeed('house-b'), 40);
    const idOf = (s: string) => s.match(/id="([^"]+)"/)?.[1];
    expect(idOf(a)).not.toBe(idOf(b));
  });
});

describe('seed resolution', () => {
  it('falls back to the slug', () => {
    expect(resolveCrestSeed({ slug: 'house-thorne-123' })).toBe('house-thorne-123');
    expect(resolveCrestSeed({ slug: 'house-thorne-123', crestSeed: null })).toBe('house-thorne-123');
    expect(resolveCrestSeed({ slug: 'house-thorne-123', crestSeed: '' })).toBe('house-thorne-123');
  });

  it('prefers an explicit seed', () => {
    expect(resolveCrestSeed({ slug: 'a', crestSeed: 'b' })).toBe('b');
  });

  it('changes the cache key when the seed changes', () => {
    expect(crestCacheKey('a')).not.toBe(crestCacheKey('b'));
    expect(crestCacheKey('a')).toHaveLength(8);
  });

  it('generates distinct random seeds', () => {
    const seeds = new Set(Array.from({ length: 200 }, randomCrestSeed));
    expect(seeds.size).toBe(200);
  });

  it('generates random seeds the schema will accept', () => {
    for (let i = 0; i < 100; i++) expect(randomCrestSeed()).toMatch(/^[a-z0-9-]{1,64}$/i);
  });
});
