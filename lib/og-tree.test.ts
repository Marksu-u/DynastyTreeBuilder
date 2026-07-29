import { describe, it, expect } from 'vitest';
import { principalBloodline, renderTreeSvg, buildOgGraph } from './og-tree';

// Founder A + partner B → children C and D; C → E. Longest chain is A→C→E.
const NODES = ['A', 'B', 'C', 'D', 'E', 'u1', 'u2'].map((id) => ({
  id,
  type: id.startsWith('u') ? 'union' : 'character',
}));
// `data.type` is load-bearing: buildFamilyGraph and layoutGenealogy both key off
// it to decide what a union's partners and children are.
const EDGES = [
  { source: 'A', target: 'u1', data: { type: 'PARTNER' } },
  { source: 'B', target: 'u1', data: { type: 'PARTNER' } },
  { source: 'u1', target: 'C', data: { type: 'CHILD' } },
  { source: 'u1', target: 'D', data: { type: 'CHILD' } },
  { source: 'C', target: 'u2', data: { type: 'PARTNER' } },
  { source: 'u2', target: 'E', data: { type: 'CHILD' } },
];

describe('principalBloodline', () => {
  it('follows the longest chain of descent from the founder', () => {
    expect(principalBloodline(NODES, EDGES, ['A'])).toEqual(['A', 'C', 'E']);
  });

  it('is deterministic across calls', () => {
    expect(principalBloodline(NODES, EDGES, ['A'])).toEqual(principalBloodline(NODES, EDGES, ['A']));
  });

  it('falls back to the deepest chain when no founder is flagged', () => {
    expect(principalBloodline(NODES, EDGES, []).length).toBeGreaterThan(1);
  });

  it('handles a lone character', () => {
    expect(principalBloodline([{ id: 'A', type: 'character' }], [], ['A'])).toEqual(['A']);
  });

  it('returns nothing for an empty dynasty', () => {
    expect(principalBloodline([], [], [])).toEqual([]);
  });
});

describe('renderTreeSvg', () => {
  it('emits svg with no NaN', () => {
    const svg = renderTreeSvg(NODES, EDGES, ['A'], { width: 600, height: 460 });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('undefined');
  });

  it('renders an empty dynasty without throwing', () => {
    expect(() => renderTreeSvg([], [], [], { width: 600, height: 460 })).not.toThrow();
  });

  it('renders a single character without throwing', () => {
    const svg = renderTreeSvg([{ id: 'A', type: 'character' }], [], ['A'], { width: 600, height: 460 });
    expect(svg).toContain('<rect');
    expect(svg).not.toContain('NaN');
  });

  it('caps how many characters it draws', () => {
    const many = Array.from({ length: 200 }, (_, i) => ({ id: `c${i}`, type: 'character' }));
    const svg = renderTreeSvg(many, [], [], { width: 600, height: 460, max: 60 });
    // Three rects per card: the card plus two text bars.
    expect((svg.match(/<rect/g) ?? []).length).toBeLessThanOrEqual(60 * 3);
  });
});

describe('buildOgGraph', () => {
  it('turns legacy pair edges into union nodes', () => {
    const graph = buildOgGraph(
      [{ id: 'A', flags: ['FOUNDER'] }, { id: 'B', flags: [] }, { id: 'C', flags: [] }],
      [
        { fromId: 'A', toId: 'B', type: 'SPOUSE' },
        { fromId: 'A', toId: 'C', type: 'PARENT' },
      ],
    );
    expect(graph.nodes.some((n) => n.type === 'union')).toBe(true);
    expect(graph.founderIds).toEqual(['A']);
  });

  it('survives a dynasty with no relationships', () => {
    const graph = buildOgGraph([{ id: 'A', flags: [] }], []);
    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toEqual([]);
    expect(graph.founderIds).toEqual([]);
  });
});
