import { describe, it, expect } from 'vitest';
import { characterLinks } from './character-links';
import type { AnyCanvasNode, RelationshipEdgeType } from '@/store/canvas';
import type { CharacterData } from '@/types/canvas';

const data = (name: string, extra: Partial<CharacterData> = {}): CharacterData =>
  ({ name, flags: [], style: 'OTHER', gender: 'UNKNOWN', ...extra });
const charNode = (id: string, extra: Partial<CharacterData> = {}): AnyCanvasNode =>
  ({ id, type: 'character', position: { x: 0, y: 0 }, data: data(id, extra) });
const unionNode = (id: string): AnyCanvasNode =>
  ({ id, type: 'union', position: { x: 0, y: 0 }, data: {} });
const edge = (
  id: string, source: string, target: string,
  type: 'PARTNER' | 'CHILD' | 'ADOPTED_CHILD',
): RelationshipEdgeType =>
  ({ id, type: 'relationship', source, target, data: { type, isMutual: false } });

describe('characterLinks', () => {
  it('finds partner, children and parents across the union indirection', () => {
    // gran + gramps -> u0 -> anchor;  anchor + wife -> u1 -> kid, adoptee
    const nodes = [
      charNode('gran'), charNode('gramps'), unionNode('u0'),
      charNode('anchor'), charNode('wife'), unionNode('u1'),
      charNode('kid'), charNode('adoptee'),
    ];
    const edges = [
      edge('e1', 'gran', 'u0', 'PARTNER'),
      edge('e2', 'gramps', 'u0', 'PARTNER'),
      edge('e3', 'u0', 'anchor', 'CHILD'),
      edge('e4', 'anchor', 'u1', 'PARTNER'),
      edge('e5', 'wife', 'u1', 'PARTNER'),
      edge('e6', 'u1', 'kid', 'CHILD'),
      edge('e7', 'u1', 'adoptee', 'ADOPTED_CHILD'),
    ];

    const links = characterLinks(nodes, edges, 'anchor');

    expect(links.partners.map(p => p.id)).toEqual(['wife']);
    expect(links.parents.map(p => p.id).sort()).toEqual(['gramps', 'gran']);
    expect(links.children.map(c => c.id).sort()).toEqual(['adoptee', 'kid']);
  });

  it('marks adopted children and leaves biological ones unflagged', () => {
    const nodes = [charNode('a'), unionNode('u'), charNode('bio'), charNode('adopted')];
    const edges = [
      edge('e1', 'a', 'u', 'PARTNER'),
      edge('e2', 'u', 'bio', 'CHILD'),
      edge('e3', 'u', 'adopted', 'ADOPTED_CHILD'),
    ];

    const { children } = characterLinks(nodes, edges, 'a');

    expect(children.find(c => c.id === 'bio')?.adopted).toBe(false);
    expect(children.find(c => c.id === 'adopted')?.adopted).toBe(true);
  });

  it('never lists the person as their own partner', () => {
    const nodes = [charNode('solo'), unionNode('u'), charNode('kid')];
    const edges = [edge('e1', 'solo', 'u', 'PARTNER'), edge('e2', 'u', 'kid', 'CHILD')];

    const links = characterLinks(nodes, edges, 'solo');

    expect(links.partners).toEqual([]);
    expect(links.children.map(c => c.id)).toEqual(['kid']);
  });

  it('gathers children across several unions, without duplicates', () => {
    const nodes = [
      charNode('a'), charNode('w1'), charNode('w2'),
      unionNode('u1'), unionNode('u2'), charNode('k1'), charNode('k2'),
    ];
    const edges = [
      edge('e1', 'a', 'u1', 'PARTNER'), edge('e2', 'w1', 'u1', 'PARTNER'),
      edge('e3', 'u1', 'k1', 'CHILD'),
      edge('e4', 'a', 'u2', 'PARTNER'), edge('e5', 'w2', 'u2', 'PARTNER'),
      edge('e6', 'u2', 'k2', 'CHILD'),
    ];

    const links = characterLinks(nodes, edges, 'a');

    expect(links.partners.map(p => p.id).sort()).toEqual(['w1', 'w2']);
    expect(links.children.map(c => c.id).sort()).toEqual(['k1', 'k2']);
  });

  it('flags ghost parents so the UI can refuse to open them', () => {
    const nodes = [charNode('ghost', { isGhost: true }), unionNode('u'), charNode('me')];
    const edges = [edge('e1', 'ghost', 'u', 'PARTNER'), edge('e2', 'u', 'me', 'CHILD')];

    const { parents } = characterLinks(nodes, edges, 'me');

    expect(parents).toEqual([{ id: 'ghost', name: 'ghost', isGhost: true }]);
  });

  it('returns empty lists for an unconnected character', () => {
    const links = characterLinks([charNode('lonely')], [], 'lonely');
    expect(links).toEqual({ partners: [], parents: [], children: [] });
  });
});
