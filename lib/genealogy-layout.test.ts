import { describe, it, expect } from 'vitest';
import {
  buildFamilyGraph, assignGenerations, layoutGenealogy,
  CARD_W, CARD_H, PARTNER_GAP, ROW_HEIGHT, CLUSTER_GAP,
} from './genealogy-layout';

// ── fixture helpers ───────────────────────────────────────────────────────────
const char = (id: string) => ({ id, type: 'character' as const });
const union = (id: string) => ({ id, type: 'union' as const });
const partner = (charId: string, unionId: string) => ({
  source: charId, target: unionId, data: { type: 'PARTNER' as const },
});
const child = (unionId: string, charId: string, adopted = false) => ({
  source: unionId, target: charId,
  data: { type: adopted ? ('ADOPTED_CHILD' as const) : ('CHILD' as const) },
});

/** dad + mom married via u1, kids c1..cN */
function nuclear(kids = 1) {
  const nodes = [char('dad'), char('mom'), union('u1'),
    ...Array.from({ length: kids }, (_, i) => char(`c${i + 1}`))];
  const edges = [partner('dad', 'u1'), partner('mom', 'u1'),
    ...Array.from({ length: kids }, (_, i) => child('u1', `c${i + 1}`))];
  return { nodes, edges };
}

describe('buildFamilyGraph', () => {
  it('collects partners and children per union', () => {
    const { nodes, edges } = nuclear(2);
    const g = buildFamilyGraph(nodes, edges);
    expect(g.unionById.get('u1')!.partners).toEqual(['dad', 'mom']);
    expect(g.unionById.get('u1')!.children).toEqual(['c1', 'c2']);
    expect(g.parentUnions.get('c1')![0].id).toBe('u1');
    expect(g.partnerUnions.get('dad')![0].id).toBe('u1');
  });

  it('ignores duplicate edges', () => {
    const { nodes, edges } = nuclear(1);
    const g = buildFamilyGraph(nodes, [...edges, partner('dad', 'u1'), child('u1', 'c1')]);
    expect(g.unionById.get('u1')!.partners).toEqual(['dad', 'mom']);
    expect(g.unionById.get('u1')!.children).toEqual(['c1']);
  });
});

describe('assignGenerations', () => {
  it('parents rank 0, child rank 1', () => {
    const { nodes, edges } = nuclear(1);
    const r = assignGenerations(buildFamilyGraph(nodes, edges));
    expect(r.get('dad')).toBe(0);
    expect(r.get('mom')).toBe(0);
    expect(r.get('c1')).toBe(1);
  });

  it('equalizes partners across generations (marrying in pulls down)', () => {
    // gp -u0-> p ; p + spouse -u1-> k. spouse has no parents but must sit at p's rank.
    const nodes = [char('gp'), union('u0'), char('p'), char('spouse'), union('u1'), char('k')];
    const edges = [partner('gp', 'u0'), child('u0', 'p'),
      partner('p', 'u1'), partner('spouse', 'u1'), child('u1', 'k')];
    const r = assignGenerations(buildFamilyGraph(nodes, edges));
    expect(r.get('gp')).toBe(0);
    expect(r.get('p')).toBe(1);
    expect(r.get('spouse')).toBe(1);
    expect(r.get('k')).toBe(2);
  });

  it('terminates on cyclic (corrupt) data', () => {
    // a -u1-> b ; b -u2-> a  (a is b's parent AND child)
    const nodes = [char('a'), char('b'), union('u1'), union('u2')];
    const edges = [partner('a', 'u1'), child('u1', 'b'), partner('b', 'u2'), child('u2', 'a')];
    const r = assignGenerations(buildFamilyGraph(nodes, edges));
    expect(r.get('a')).toBeTypeOf('number'); // finite, no hang
    expect(r.get('b')).toBeTypeOf('number');
  });
});
