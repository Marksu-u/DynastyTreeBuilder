/**
 * Procedural heraldic crests.
 *
 * Dependency-free and pure on purpose: the same code runs in the browser, in a
 * server component, and inside the `next/og` image routes.
 *
 * `crestFromSeed` is effectively a WIRE FORMAT. Generated crests get baked into
 * Open Graph images that platforms cache for weeks, so changing the seed → spec
 * mapping silently rewrites the arms of houses people have already shared.
 * `lib/crest.test.ts` pins a table of known seeds to catch exactly that.
 */

export type TinctureName =
  | 'or' | 'argent' | 'gules' | 'azure' | 'vert' | 'purpure' | 'sable';

export const TINCTURES: Record<TinctureName, { hex: string; class: 'metal' | 'colour' }> = {
  or:      { hex: '#EF9F27', class: 'metal'  },
  argent:  { hex: '#E6EAF5', class: 'metal'  },
  gules:   { hex: '#B23A32', class: 'colour' },
  azure:   { hex: '#3B5FA8', class: 'colour' },
  vert:    { hex: '#3E8168', class: 'colour' },
  purpure: { hex: '#7B5AA6', class: 'colour' },
  sable:   { hex: '#151A2B', class: 'colour' },
};

const ALL_TINCTURES = Object.keys(TINCTURES) as TinctureName[];
const METALS  = ALL_TINCTURES.filter((t) => TINCTURES[t].class === 'metal');
const COLOURS = ALL_TINCTURES.filter((t) => TINCTURES[t].class === 'colour');

export const SHAPES = ['heater', 'rounded', 'pointed', 'square'] as const;
export const DIVISIONS = ['plain', 'perPale', 'perFess', 'quarterly', 'perBend', 'perChevron'] as const;
export const CHARGES = [
  'mullet', 'crescent', 'lozenge', 'tower', 'sun', 'key',
  'sword', 'chevron', 'rose', 'flame', 'chalice', 'anchor',
] as const;
export const ARRANGEMENTS = ['single', 'three', 'pale'] as const;

export type ShieldShape = (typeof SHAPES)[number];
export type FieldDivision = (typeof DIVISIONS)[number];
export type Charge = (typeof CHARGES)[number];
export type ChargeArrangement = (typeof ARRANGEMENTS)[number];

export interface CrestSpec {
  shape: ShieldShape;
  division: FieldDivision;
  field: [TinctureName] | [TinctureName, TinctureName];
  charge: Charge;
  arrangement: ChargeArrangement;
  chargeTincture: TinctureName;
}

/** FNV-1a, 32-bit. Hand-rolled to keep this module dependency-free. */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * One hash per attribute, each with its own domain tag. Slicing a single 32-bit
 * value across six attributes correlates them on similar seeds ("house-a" and
 * "house-b" would share a shield shape); tagging avoids that.
 */
function pick<T>(list: readonly T[], seed: string, tag: string): T {
  return list[fnv1a(`${seed}:${tag}`) % list.length];
}

export function crestFromSeed(seed: string): CrestSpec {
  const shape = pick(SHAPES, seed, 'shape');
  const division = pick(DIVISIONS, seed, 'division');
  const charge = pick(CHARGES, seed, 'charge');
  const arrangement = pick(ARRANGEMENTS, seed, 'arrangement');

  // Rule of tincture: never metal on metal, never colour on colour. A plain
  // field may be either class and the charge takes the other. A divided field
  // is always two different colours, so a metal charge contrasts with both
  // halves and never needs counterchanging.
  if (division === 'plain') {
    const field = pick(ALL_TINCTURES, seed, 'field1');
    const chargeTincture =
      TINCTURES[field].class === 'metal'
        ? pick(COLOURS, seed, 'chargeTincture')
        : pick(METALS, seed, 'chargeTincture');
    return { shape, division, field: [field], charge, arrangement, chargeTincture };
  }

  const first = pick(COLOURS, seed, 'field1');
  const second = pick(COLOURS.filter((c) => c !== first), seed, 'field2');
  return {
    shape,
    division,
    field: [first, second],
    charge,
    arrangement,
    chargeTincture: pick(METALS, seed, 'chargeTincture'),
  };
}
