import { describe, it, expect } from 'vitest';
import { migrateCanvas } from './migrate-canvas';
import type { Node, Edge } from '@xyflow/react';
import type { CharacterData, RelationshipData } from '@/types/canvas';

type AnyNode = Node<CharacterData, 'character'>;
type AnyEdge = Edge<RelationshipData, 'relationship'>;

const charNode = (id: string): AnyNode =>
  ({ id, type: 'character', position: { x: 0, y: 0 }, data: { name: id, flags: [], style: 'OTHER', gender: 'UNKNOWN' } });
const spouseEdge = (id: string, source: string, target: string): AnyEdge =>
  ({ id, type: 'relationship', source, target, data: { type: 'SPOUSE', isMutual: false } });

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
});
