import { describe, it, expect } from 'vitest';
import { buildFamilyGraph } from './genealogy-layout';
import { descendantSubtree } from './descendant-subtree';

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
