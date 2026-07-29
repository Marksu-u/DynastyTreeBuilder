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

const SHIELD_PATHS: Record<ShieldShape, string> = {
  heater:  'M5,3 L55,3 L55,38 C55,56 42,66 30,70 C18,66 5,56 5,38 Z',
  rounded: 'M5,3 L55,3 L55,40 C55,58 44,69 30,69 C16,69 5,58 5,40 Z',
  pointed: 'M5,3 L55,3 L55,36 L30,71 L5,36 Z',
  square:  'M5,3 L55,3 L55,62 C55,66 52,68 48,68 L12,68 C8,68 5,66 5,62 Z',
};

/** Field fills, drawn inside the shield clip over the full 60×72 box. */
function fieldMarkup(spec: CrestSpec): string {
  const a = TINCTURES[spec.field[0]].hex;
  const b = spec.field[1] ? TINCTURES[spec.field[1]].hex : a;
  switch (spec.division) {
    case 'plain':
      return `<rect x="0" y="0" width="60" height="72" fill="${a}"/>`;
    case 'perPale':
      return `<rect x="0" y="0" width="30" height="72" fill="${a}"/><rect x="30" y="0" width="30" height="72" fill="${b}"/>`;
    case 'perFess':
      return `<rect x="0" y="0" width="60" height="36" fill="${a}"/><rect x="0" y="36" width="60" height="36" fill="${b}"/>`;
    case 'quarterly':
      return `<rect x="0" y="0" width="30" height="36" fill="${a}"/><rect x="30" y="0" width="30" height="36" fill="${b}"/><rect x="0" y="36" width="30" height="36" fill="${b}"/><rect x="30" y="36" width="30" height="36" fill="${a}"/>`;
    case 'perBend':
      return `<rect x="0" y="0" width="60" height="72" fill="${a}"/><path d="M0,72 L60,0 L60,72 Z" fill="${b}"/>`;
    case 'perChevron':
      return `<rect x="0" y="0" width="60" height="72" fill="${a}"/><path d="M30,26 L60,56 L60,72 L0,72 L0,56 Z" fill="${b}"/>`;
  }
}

/** Charges, normalised to a -12..12 box around the origin. */
const CHARGE_MARKUP: Record<Charge, (fill: string) => string> = {
  mullet:   (f) => `<path d="M0,-12 L3.5,-4 L12,-4 L5,1.5 L7.5,10 L0,5 L-7.5,10 L-5,1.5 L-12,-4 L-3.5,-4 Z" fill="${f}"/>`,
  crescent: (f) => `<path d="M5,-11 A12,12 0 1,0 5,11 A9.5,9.5 0 1,1 5,-11 Z" fill="${f}"/>`,
  lozenge:  (f) => `<path d="M0,-12 L9,0 L0,12 L-9,0 Z" fill="${f}"/>`,
  tower:    (f) => `<path d="M-9,-4 h3 v-4 h3.5 v4 h5 v-4 h3.5 v4 h3 v16 h-21 Z" fill="${f}"/>`,
  sun:      (f) => `<path d="M0,-12 L2.8,-5 L9.9,-9.9 L5,-2.8 L12,0 L5,2.8 L9.9,9.9 L2.8,5 L0,12 L-2.8,5 L-9.9,9.9 L-5,2.8 L-12,0 L-5,-2.8 L-9.9,-9.9 L-2.8,-5 Z" fill="${f}"/>`,
  key:      (f) => `<circle cx="0" cy="-7" r="5" fill="none" stroke="${f}" stroke-width="2.5"/><path d="M-1.2,-2 h2.4 v14 h-2.4 Z M1.2,5 h5 v2.2 h-5 Z M1.2,9 h4 v2.2 h-4 Z" fill="${f}"/>`,
  sword:    (f) => `<path d="M0,-12 L2,-6 L2,5 L4,5 L4,7.2 L1,7.2 L1,12 L-1,12 L-1,7.2 L-4,7.2 L-4,5 L-2,5 L-2,-6 Z" fill="${f}"/>`,
  chevron:  (f) => `<path d="M0,-7 L11,4 L11,10.5 L0,-0.5 L-11,10.5 L-11,4 Z" fill="${f}"/>`,
  rose:     (f) => `<circle cx="0" cy="-7.5" r="4.6" fill="${f}"/><circle cx="7.1" cy="-2.3" r="4.6" fill="${f}"/><circle cx="4.4" cy="6.1" r="4.6" fill="${f}"/><circle cx="-4.4" cy="6.1" r="4.6" fill="${f}"/><circle cx="-7.1" cy="-2.3" r="4.6" fill="${f}"/><circle cx="0" cy="0" r="3.6" fill="${f}"/>`,
  flame:    (f) => `<path d="M0,-12 C5,-5 9,-2.5 9,3.5 A9,9 0 1,1 -9,3.5 C-9,-2.5 -3,-4.5 0,-12 Z" fill="${f}"/>`,
  chalice:  (f) => `<path d="M-8,-10 h16 v3.5 a8,8 0 0,1 -6.6,7.9 v6.6 h5.1 v3 h-13 v-3 h5.1 v-6.6 a8,8 0 0,1 -6.6,-7.9 Z" fill="${f}"/>`,
  anchor:   (f) => `<circle cx="0" cy="-10" r="3.2" fill="none" stroke="${f}" stroke-width="2.2"/><path d="M-1.3,-6 h2.6 v17 h-2.6 Z M-6,-3.5 h12 v2.2 h-12 Z" fill="${f}"/><path d="M-9,4 a9,9 0 0,0 18,0 h-2.6 a6.4,6.4 0 0,1 -12.8,0 Z" fill="${f}"/>`,
};

/** Where the charge (or charges) sit, as translate + scale pairs. */
const ARRANGEMENT_PLACEMENTS: Record<ChargeArrangement, ReadonlyArray<[number, number, number]>> = {
  single: [[30, 36, 1]],
  three:  [[20, 26, 0.52], [40, 26, 0.52], [30, 50, 0.52]],
  pale:   [[30, 20, 0.46], [30, 36, 0.46], [30, 52, 0.46]],
};

let crestIdCounter = 0;

export function crestToSvg(spec: CrestSpec, size: number): string {
  // Unique per call: several crests can render into one document (dashboard
  // grid, picker row) and duplicate clipPath ids would cross-contaminate.
  const id = `crest-${(crestIdCounter++).toString(36)}-${fnv1a(JSON.stringify(spec)).toString(36)}`;
  const shield = SHIELD_PATHS[spec.shape];
  const chargeFill = TINCTURES[spec.chargeTincture].hex;
  const charge = CHARGE_MARKUP[spec.charge](chargeFill);
  const charges = ARRANGEMENT_PLACEMENTS[spec.arrangement]
    .map(([x, y, k]) => `<g transform="translate(${x},${y}) scale(${k})">${charge}</g>`)
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * 1.2)}" viewBox="0 0 60 72" role="img">` +
    `<clipPath id="${id}"><path d="${shield}"/></clipPath>` +
    `<g clip-path="url(#${id})">${fieldMarkup(spec)}${charges}</g>` +
    `<path d="${shield}" fill="none" stroke="${TINCTURES.or.hex}" stroke-width="1.6"/>` +
    `</svg>`
  );
}
