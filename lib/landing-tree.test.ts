import { describe, it, expect } from 'vitest';
import { renderLandingTree } from './landing-tree';

// A → children C, D; C → E. Three generations.
const NODES = ['A', 'B', 'C', 'D', 'E', 'u1', 'u2'].map((id) => ({
  id,
  type: id.startsWith('u') ? 'union' : 'character',
}));
const EDGES = [
  { source: 'A', target: 'u1', data: { type: 'PARTNER' } },
  { source: 'B', target: 'u1', data: { type: 'PARTNER' } },
  { source: 'u1', target: 'C', data: { type: 'CHILD' } },
  { source: 'u1', target: 'D', data: { type: 'CHILD' } },
  { source: 'C', target: 'u2', data: { type: 'PARTNER' } },
  { source: 'u2', target: 'E', data: { type: 'CHILD' } },
];

describe('renderLandingTree', () => {
  it('groups cards into generation bands', () => {
    const { svg, generations } = renderLandingTree(NODES, EDGES, ['A']);
    expect(generations).toBe(3);
    for (let i = 0; i < generations; i++) {
      expect(svg).toContain(`data-gen="${i}"`);
    }
  });

  it('places every card in exactly one band', () => {
    const { svg } = renderLandingTree(NODES, EDGES, ['A']);
    expect((svg.match(/class="dt-card"/g) ?? []).length).toBe(5);
  });

  it('normalises connector length so the draw-on is uniform', () => {
    const { svg } = renderLandingTree(NODES, EDGES, ['A']);
    const conns = (svg.match(/class="dt-conn[^"]*"/g) ?? []).length;
    expect(conns).toBeGreaterThan(0);
    expect((svg.match(/pathLength="1"/g) ?? []).length).toBe(conns);
  });

  it('marks the bloodline connectors as lit', () => {
    const { svg } = renderLandingTree(NODES, EDGES, ['A']);
    expect(svg).toContain('dt-lit');
  });

  it('emits no NaN and survives an empty dynasty', () => {
    expect(renderLandingTree(NODES, EDGES, ['A']).svg).not.toContain('NaN');
    expect(renderLandingTree([], [], []).svg).toBe('');
  });
});
