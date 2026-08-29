import { describe, it, expect } from 'vitest';
import { buildFamilyGraph } from './genealogy-layout';
import { descendantSubtree, bloodlineHighlight, unionHighlight } from './descendant-subtree';

const char = (id: string) => ({ id, type: 'character' as const });
const union = (id: string) => ({ id, type: 'union' as const });
const partner = (charId: string, unionId: string) => ({
  source: charId, target: unionId, data: { type: 'PARTNER' as const },
});
const child = (unionId: string, charId: string) => ({
  source: unionId, target: charId, data: { type: 'CHILD' as const },
});

describe('descendantSubtree', () => {
  it('walks children and grandchildren, including marrying-in spouses', () => {
    const nodes = [
      char('g'), char('sp'), union('u1'), char('c1'),
      char('sp2'), union('u2'), char('gc1'),
    ];
    const edges = [
      partner('g', 'u1'), partner('sp', 'u1'), child('u1', 'c1'),
      partner('c1', 'u2'), partner('sp2', 'u2'), child('u2', 'gc1'),
    ];
    const graph = buildFamilyGraph(nodes, edges);
    const { charIds, unionIds } = descendantSubtree(graph, 'g');
    expect([...charIds].sort()).toEqual(['c1', 'g', 'gc1', 'sp', 'sp2']);
    expect([...unionIds].sort()).toEqual(['u1', 'u2']);
  });

  it('excludes ancestors and unrelated branches', () => {
    const nodes = [
      char('p1'), char('p2'), union('u0'), char('g'),
      char('sp'), union('u1'), char('c1'),
    ];
    const edges = [
      partner('p1', 'u0'), partner('p2', 'u0'), child('u0', 'g'),
      partner('g', 'u1'), partner('sp', 'u1'), child('u1', 'c1'),
    ];
    const graph = buildFamilyGraph(nodes, edges);
    const { charIds } = descendantSubtree(graph, 'g');
    expect(charIds.has('p1')).toBe(false);
    expect(charIds.has('p2')).toBe(false);
    expect(charIds.has('u0' as string)).toBe(false);
    expect(charIds.has('c1')).toBe(true);
  });

  it('covers all unions of a multi-partner parent', () => {
    const nodes = [
      char('dad'), char('mom'), char('mom2'),
      union('u1'), union('u2'), char('c1'), char('c2'),
    ];
    const edges = [
      partner('dad', 'u1'), partner('mom', 'u1'), child('u1', 'c1'),
      partner('dad', 'u2'), partner('mom2', 'u2'), child('u2', 'c2'),
    ];
    const graph = buildFamilyGraph(nodes, edges);
    const { charIds, unionIds } = descendantSubtree(graph, 'dad');
    expect(unionIds.has('u1')).toBe(true);
    expect(unionIds.has('u2')).toBe(true);
    expect(charIds.has('c1')).toBe(true);
    expect(charIds.has('c2')).toBe(true);
    expect(charIds.has('mom')).toBe(true);
    expect(charIds.has('mom2')).toBe(true);
  });
});

// Four-generation spine: gg1+gg2 → gp ; gp+gpS → p ; p+pS → me ; me+meS → kid.
// `me` also has a sibling `sib`, and there is an unrelated couple `x1`+`x2`.
function spine() {
  const nodes = [
    char('gg1'), char('gg2'), union('uGG'),
    char('gp'), char('gpS'), union('uGP'),
    char('p'), char('pS'), union('uP'),
    char('me'), char('sib'), char('meS'), union('uMe'), char('kid'),
    char('x1'), char('x2'), union('uX'),
  ];
  const edges = [
    partner('gg1', 'uGG'), partner('gg2', 'uGG'), child('uGG', 'gp'),
    partner('gp', 'uGP'), partner('gpS', 'uGP'), child('uGP', 'p'),
    partner('p', 'uP'), partner('pS', 'uP'), child('uP', 'me'), child('uP', 'sib'),
    partner('me', 'uMe'), partner('meS', 'uMe'), child('uMe', 'kid'),
    partner('x1', 'uX'), partner('x2', 'uX'),
  ];
  return buildFamilyGraph(nodes, edges);
}

describe('bloodlineHighlight', () => {
  it('walks ancestors upward, tiering them by generation', () => {
    const { chars } = bloodlineHighlight(spine(), 'me');
    expect(chars.get('me')).toEqual({ tier: 'root', depth: 0 });
    expect(chars.get('p')).toEqual({ tier: 'ancestor', depth: -1 });
    expect(chars.get('pS')).toEqual({ tier: 'ancestor', depth: -1 });
    expect(chars.get('gp')).toEqual({ tier: 'ancestor', depth: -2 });
    expect(chars.get('gg1')).toEqual({ tier: 'ancestor', depth: -3 });
  });

  it('walks descendants downward and marks married-in partners as spouses', () => {
    const { chars } = bloodlineHighlight(spine(), 'me');
    expect(chars.get('kid')).toEqual({ tier: 'descendant', depth: 1 });
    expect(chars.get('meS')).toEqual({ tier: 'spouse', depth: 0 });
  });

  it('responds for a childless, unmarried person (the old dead spot)', () => {
    // `sib` has no unions at all — the descendant-only walk returned nothing.
    const { chars, unions } = bloodlineHighlight(spine(), 'sib');
    expect(chars.get('sib')).toEqual({ tier: 'root', depth: 0 });
    expect(chars.get('p')).toEqual({ tier: 'ancestor', depth: -1 });
    expect(chars.get('gg1')).toEqual({ tier: 'ancestor', depth: -3 });
    expect(unions.size).toBeGreaterThan(0);
  });

  it('does not wander into siblings or unrelated branches', () => {
    const { chars } = bloodlineHighlight(spine(), 'me');
    expect(chars.has('sib')).toBe(false); // a sibling is not on my lineage spine
    expect(chars.has('x1')).toBe(false);
    expect(chars.has('x2')).toBe(false);
  });

  it('tiers unions so ancestry and descent can be tinted apart', () => {
    const { unions } = bloodlineHighlight(spine(), 'me');
    expect(unions.get('uP')!.tier).toBe('ancestor');   // my parents' marriage
    expect(unions.get('uGP')!.tier).toBe('ancestor');
    expect(unions.get('uMe')!.tier).toBe('descendant'); // my own marriage
    expect(unions.has('uX')).toBe(false);
  });

  it('keeps blood over spouse when a person is reachable both ways', () => {
    // cousin marriage: me marries my own first cousin `cous`.
    const nodes = [
      char('a1'), char('a2'), union('uA'), char('b1'), char('b2'),
      union('uB1'), char('s1'), union('uB2'), char('cous'),
      union('uM'),
    ];
    const edges = [
      partner('a1', 'uA'), partner('a2', 'uA'), child('uA', 'b1'), child('uA', 'b2'),
      partner('b1', 'uB1'), child('uB1', 's1'),
      partner('b2', 'uB2'), child('uB2', 'cous'),
      partner('s1', 'uM'), partner('cous', 'uM'),
    ];
    const { chars } = bloodlineHighlight(buildFamilyGraph(nodes, edges), 's1');
    expect(chars.get('a1')!.tier).toBe('ancestor'); // grandparent, not demoted
    expect(chars.get('s1')!.tier).toBe('root');
  });

  it('is stable regardless of how many unions the root has', () => {
    const a = bloodlineHighlight(spine(), 'me');
    const b = bloodlineHighlight(spine(), 'me');
    expect([...a.chars.entries()]).toEqual([...b.chars.entries()]);
  });
});

describe('unionHighlight', () => {
  it('lights just the couple and their children', () => {
    const { chars, unions } = unionHighlight(spine(), 'uP');
    expect(chars.get('p')).toEqual({ tier: 'root', depth: 0 });
    expect(chars.get('pS')).toEqual({ tier: 'root', depth: 0 });
    expect(chars.get('me')).toEqual({ tier: 'descendant', depth: 1 });
    expect(chars.get('sib')).toEqual({ tier: 'descendant', depth: 1 });
    expect(chars.has('gp')).toBe(false);   // no ancestry
    expect(chars.has('kid')).toBe(false);  // no grandchildren
    expect([...unions.keys()]).toEqual(['uP']);
  });

  it('returns empty for an unknown union', () => {
    const { chars, unions } = unionHighlight(spine(), 'nope');
    expect(chars.size).toBe(0);
    expect(unions.size).toBe(0);
  });
});
