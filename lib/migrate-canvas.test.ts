import { describe, it, expect } from 'vitest';
import { migrateCanvas } from './migrate-canvas';
// The shared types, not local copies. The copies that used to live here declared
// AnyNode without the union variant and AnyEdge with only the client-side
// relationship types, so every migrateCanvas call below was a type error and
// every `SPOUSE` fixture needed an `as never` to compile. Vitest never
// typechecks, so none of it showed up until `tsc --noEmit` was wired into CI.
import type {
  AnyCanvasNode as AnyNode,
  LegacyEdgeType,
  RelationshipEdgeType as AnyEdge,
} from '@/types/canvas';

const charNode = (id: string): AnyNode =>
  ({ id, type: 'character', position: { x: 0, y: 0 }, data: { name: id, flags: [], style: 'OTHER', gender: 'UNKNOWN' } });
// Legacy edges: these are the DB pair shapes migrateCanvas exists to convert.
const spouseEdge = (id: string, source: string, target: string): LegacyEdgeType =>
  ({ id, type: 'relationship', source, target, data: { type: 'SPOUSE', isMutual: false } });
const parentEdge = (id: string, source: string, target: string, adopted = false): LegacyEdgeType =>
  ({ id, type: 'relationship', source, target, data: { type: adopted ? 'ADOPTED' : 'PARENT', isMutual: false } });

// Union → children helper for assertions
function unionsWithChildren(out: { nodes: AnyNode[]; edges: AnyEdge[] }) {
  const unionIds = out.nodes.filter((n) => n.type === 'union').map((n) => n.id);
  const partnersOf = (u: string) => out.edges.filter((e) => e.target === u && (e.data as { type?: string })?.type === 'PARTNER').map((e) => e.source).sort();
  const kidsOf = (u: string, type = 'CHILD') => out.edges.filter((e) => e.source === u && (e.data as { type?: string })?.type === type).map((e) => e.target).sort();
  return unionIds.map((u) => ({ partners: partnersOf(u), children: kidsOf(u), adopted: kidsOf(u, 'ADOPTED_CHILD') }));
}

describe('migrateCanvas', () => {
  it('collapses duplicate SPOUSE rows for the same pair into one union', () => {
    const nodes = [charNode('a'), charNode('b')];
    const edges = [spouseEdge('e1', 'a', 'b'), spouseEdge('e2', 'a', 'b')];
    const { nodes: outNodes } = migrateCanvas(nodes, edges);
    expect(outNodes.filter(n => n.type === 'union')).toHaveLength(1);
  });

  it('collapses reversed-direction duplicate SPOUSE rows (A→B and B→A) into one union', () => {
    const nodes = [charNode('a'), charNode('b')];
    const edges = [spouseEdge('e1', 'a', 'b'), spouseEdge('e2', 'b', 'a')];
    const { nodes: outNodes } = migrateCanvas(nodes, edges);
    expect(outNodes.filter(n => n.type === 'union')).toHaveLength(1);
  });

  it('keeps distinct unions for a character with two different partners', () => {
    const nodes = [charNode('a'), charNode('b'), charNode('c')];
    const edges = [spouseEdge('e1', 'a', 'b'), spouseEdge('e2', 'a', 'c')];
    const { nodes: outNodes } = migrateCanvas(nodes, edges);
    expect(outNodes.filter(n => n.type === 'union')).toHaveLength(2);
  });

  it('assigns each child of a multi-spouse parent to the correct parent-pair union only', () => {
    // Arslan married to Griselda (child Glenn) and Elana (child Saera).
    // Each child has a PARENT edge from BOTH of its parents (the save format).
    const nodes = ['arslan', 'griselda', 'elana', 'glenn', 'saera'].map(charNode);
    const edges = [
      spouseEdge('s1', 'arslan', 'griselda'),
      spouseEdge('s2', 'arslan', 'elana'),
      parentEdge('p1', 'arslan', 'glenn'), parentEdge('p2', 'griselda', 'glenn'),
      parentEdge('p3', 'arslan', 'saera'), parentEdge('p4', 'elana', 'saera'),
    ];
    const summary = unionsWithChildren(migrateCanvas(nodes, edges));
    const ag = summary.find(s => s.partners.join() === ['arslan', 'griselda'].sort().join());
    const ae = summary.find(s => s.partners.join() === ['arslan', 'elana'].sort().join());
    expect(ag?.children).toEqual(['glenn']);   // Glenn ONLY under Griselda's union
    expect(ae?.children).toEqual(['saera']);   // Saera ONLY under Elana's union
    // No child is duplicated across unions
    const allChildEdges = summary.flatMap(s => s.children);
    expect(allChildEdges.sort()).toEqual(['glenn', 'saera']);
  });

  it('keeps a single-parent child under a solo union', () => {
    const nodes = [charNode('mom'), charNode('kid')];
    const edges = [parentEdge('p1', 'mom', 'kid')];
    const summary = unionsWithChildren(migrateCanvas(nodes, edges));
    expect(summary).toHaveLength(1);
    expect(summary[0].partners).toEqual(['mom']);
    expect(summary[0].children).toEqual(['kid']);
  });

  it('creates a union for two co-parents with no marriage record', () => {
    const nodes = [charNode('x'), charNode('y'), charNode('kid')];
    const edges = [parentEdge('p1', 'x', 'kid'), parentEdge('p2', 'y', 'kid')];
    const summary = unionsWithChildren(migrateCanvas(nodes, edges));
    expect(summary).toHaveLength(1);
    expect(summary[0].partners).toEqual(['x', 'y']);
    expect(summary[0].children).toEqual(['kid']);
  });

  it('preserves adopted children as ADOPTED_CHILD under the right union', () => {
    const nodes = ['a', 'b', 'kid'].map(charNode);
    const edges = [
      spouseEdge('s1', 'a', 'b'),
      parentEdge('p1', 'a', 'kid', true), parentEdge('p2', 'b', 'kid', true),
    ];
    const summary = unionsWithChildren(migrateCanvas(nodes, edges));
    const u = summary.find(s => s.partners.join() === ['a', 'b'].join());
    expect(u?.children).toEqual([]);
    expect(u?.adopted).toEqual(['kid']);
  });
});
