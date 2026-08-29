import { describe, it, expect } from 'vitest';
import { computeFitViewport, type FitNode } from './fit-viewport';
import { CARD_W, CARD_H } from './genealogy-layout';

const container = { width: 1000, height: 600 };

function charAt(x: number, y: number): FitNode {
  return { position: { x, y }, type: 'character' };
}

describe('computeFitViewport', () => {
  it('returns null when there is nothing to frame', () => {
    expect(computeFitViewport([], container)).toBeNull();
  });

  it('returns null before the container has been laid out', () => {
    expect(computeFitViewport([charAt(0, 0)], { width: 0, height: 0 })).toBeNull();
  });

  it('centres a single card in the container', () => {
    const vp = computeFitViewport([charAt(0, 0)], container, { maxZoom: 1 })!;
    // The card's centre is half its size in from the origin. Derived from the
    // constants rather than written out, so growing the card cannot silently
    // leave a stale expectation behind.
    expect(vp.zoom).toBe(1);
    expect(vp.x).toBeCloseTo(1000 / 2 - CARD_W / 2);
    expect(vp.y).toBeCloseTo(600 / 2 - CARD_H / 2);
  });

  it('zooms out so a wide tree fits inside the padded container', () => {
    // Spans x 0..3180 (3000 + card width), well beyond the container.
    const nodes = [charAt(0, 0), charAt(3000, 0)];
    const vp = computeFitViewport(nodes, container, { padding: 0.1 })!;

    const treeW = 3180;
    expect(vp.zoom).toBeCloseTo((1000 * 0.8) / treeW);
    // Both extremes must land inside the container once transformed.
    expect(vp.x + 0 * vp.zoom).toBeGreaterThanOrEqual(0);
    expect(vp.x + treeW * vp.zoom).toBeLessThanOrEqual(1000);
  });

  it('never zooms past minZoom, even for an enormous tree', () => {
    const nodes = [charAt(0, 0), charAt(100000, 0)];
    const vp = computeFitViewport(nodes, container, { minZoom: 0.2 })!;
    expect(vp.zoom).toBe(0.2);
  });

  it('never zooms past maxZoom for a tiny tree', () => {
    const vp = computeFitViewport([charAt(0, 0)], container, { maxZoom: 1.5 })!;
    expect(vp.zoom).toBe(1.5);
  });

  it('uses measured dimensions when React Flow has supplied them', () => {
    const nodes: FitNode[] = [
      { position: { x: 0, y: 0 }, type: 'character', measured: { width: 400, height: 100 } },
    ];
    const vp = computeFitViewport(nodes, container, { maxZoom: 1 })!;
    expect(vp.x).toBeCloseTo(1000 / 2 - 200);
    expect(vp.y).toBeCloseTo(600 / 2 - 50);
  });

  it('treats union nodes as small anchors rather than full cards', () => {
    const wide = computeFitViewport([charAt(0, 0), { position: { x: 500, y: 0 }, type: 'character' }], container, { padding: 0 })!;
    const narrow = computeFitViewport([charAt(0, 0), { position: { x: 500, y: 0 }, type: 'union' }], container, { padding: 0 })!;
    // The union contributes only 16px of width, so the same span frames tighter.
    expect(narrow.zoom).toBeGreaterThan(wide.zoom);
  });
});
