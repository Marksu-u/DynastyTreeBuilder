import { describe, it, expect } from 'vitest';
import { computeAddRelative, computeRemoveRelative, partnerUnionsOf, computeDeleteCharacter, relativeContext } from './relative-ops';
import type { AnyCanvasNode, RelationshipEdgeType } from '@/store/canvas';
import type { CharacterData } from '@/types/canvas';

const data = (name: string): CharacterData => ({ name, flags: [], style: 'OTHER', gender: 'UNKNOWN' });
const charNode = (id: string): AnyCanvasNode =>
  ({ id, type: 'character', position: { x: 0, y: 0 }, data: data(id) });
const unionNode = (id: string): AnyCanvasNode =>
  ({ id, type: 'union', position: { x: 0, y: 0 }, data: {} });
const edge = (id: string, source: string, target: string, type: 'PARTNER' | 'CHILD' | 'ADOPTED_CHILD'): RelationshipEdgeType =>
  ({ id, type: 'relationship', source, target, data: { type, isMutual: false } });

// anchor + wife married (u1), one child kid1
const nodes = [charNode('anchor'), charNode('wife'), unionNode('u1'), charNode('kid1')];
const edges = [edge('e1', 'anchor', 'u1', 'PARTNER'), edge('e2', 'wife', 'u1', 'PARTNER'), edge('e3', 'u1', 'kid1', 'CHILD')];

describe('computeAddRelative', () => {
  it('partner (new person): new union + SPOUSE pair edge', () => {
    const r = computeAddRelative([charNode('anchor')], [], {
      anchorId: 'anchor', kind: 'partner', person: { newData: data('spouse'), newId: 'new1' },
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.nodes.filter(n => n.type === 'union')).toHaveLength(1);
    expect(r.nodes.find(n => n.id === 'new1')).toBeDefined();
    const u = r.nodes.find(n => n.type === 'union')!;
    const partnerEdges = r.edges.filter(e => e.data?.type === 'PARTNER' && e.target === u.id);
    expect(partnerEdges.map(e => e.source).sort()).toEqual(['anchor', 'new1']);
    expect(r.pairEdges).toEqual([{ fromId: 'anchor', toId: 'new1', type: 'SPOUSE' }]);
  });

  it('partner (existing): links, and rejects duplicates', () => {
    const lone = [charNode('anchor'), charNode('other')];
    const r = computeAddRelative(lone, [], {
      anchorId: 'anchor', kind: 'partner', person: { existingId: 'other' },
    });
    expect(r.ok).toBe(true);
    const dup = computeAddRelative(nodes, edges, {
      anchorId: 'anchor', kind: 'partner', person: { existingId: 'wife' },
    });
    expect(dup.ok).toBe(false);
  });

  it('rejects self-link', () => {
    const r = computeAddRelative(nodes, edges, {
      anchorId: 'anchor', kind: 'partner', person: { existingId: 'anchor' },
    });
    expect(r.ok).toBe(false);
  });

  it('child with one union: attaches with PARENT pair edges from both partners', () => {
    const r = computeAddRelative(nodes, edges, {
      anchorId: 'anchor', kind: 'child', person: { newData: data('kid2'), newId: 'new2' },
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.edges.find(e => e.source === 'u1' && e.target === 'new2' && e.data?.type === 'CHILD')).toBeDefined();
    expect(r.pairEdges.sort((a, b) => a.fromId.localeCompare(b.fromId))).toEqual([
      { fromId: 'anchor', toId: 'new2', type: 'PARENT' },
      { fromId: 'wife', toId: 'new2', type: 'PARENT' },
    ]);
  });

  it('adopted child uses ADOPTED_CHILD + ADOPTED', () => {
    const r = computeAddRelative(nodes, edges, {
      anchorId: 'anchor', kind: 'child', adopted: true, person: { newData: data('kid2'), newId: 'new2' },
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.edges.find(e => e.target === 'new2')!.data?.type).toBe('ADOPTED_CHILD');
    expect(r.pairEdges.every(p => p.type === 'ADOPTED')).toBe(true);
  });

  it('child with no union: creates a solo-parent union', () => {
    const lone = [charNode('anchor')];
    const r = computeAddRelative(lone, [], {
      anchorId: 'anchor', kind: 'child', person: { newData: data('kid'), newId: 'new1' },
    });
    if (!r.ok) throw new Error(r.error);
    const u = r.nodes.find(n => n.type === 'union')!;
    expect(r.edges.find(e => e.source === 'anchor' && e.target === u.id)).toBeDefined();
    expect(r.pairEdges).toEqual([{ fromId: 'anchor', toId: 'new1', type: 'PARENT' }]);
  });

  it('child with several unions requires unionId', () => {
    const n2 = [...nodes, charNode('wife2'), unionNode('u2')];
    const e2 = [...edges, edge('e4', 'anchor', 'u2', 'PARTNER'), edge('e5', 'wife2', 'u2', 'PARTNER')];
    const ambiguous = computeAddRelative(n2, e2, {
      anchorId: 'anchor', kind: 'child', person: { newData: data('kid2'), newId: 'new2' },
    });
    expect(ambiguous.ok).toBe(false);
    const explicit = computeAddRelative(n2, e2, {
      anchorId: 'anchor', kind: 'child', unionId: 'u2', person: { newData: data('kid2'), newId: 'new2' },
    });
    if (!explicit.ok) throw new Error(explicit.error);
    expect(explicit.edges.find(e => e.source === 'u2' && e.target === 'new2')).toBeDefined();
    expect(explicit.pairEdges.map(p => p.fromId).sort()).toEqual(['anchor', 'wife2']);
  });

  it('first parent: union above the anchor', () => {
    const lone = [charNode('anchor')];
    const r = computeAddRelative(lone, [], {
      anchorId: 'anchor', kind: 'parent', person: { newData: data('father'), newId: 'new1' },
    });
    if (!r.ok) throw new Error(r.error);
    const u = r.nodes.find(n => n.type === 'union')!;
    expect(r.edges.find(e => e.source === 'new1' && e.target === u.id && e.data?.type === 'PARTNER')).toBeDefined();
    expect(r.edges.find(e => e.source === u.id && e.target === 'anchor' && e.data?.type === 'CHILD')).toBeDefined();
    expect(r.pairEdges).toEqual([{ fromId: 'new1', toId: 'anchor', type: 'PARENT' }]);
  });

  it('second parent joins the existing parent union and adopts its children', () => {
    // father -u- (anchor, sib): adding mother must SPOUSE father and PARENT both kids
    const n = [charNode('father'), unionNode('u'), charNode('anchor'), charNode('sib')];
    const e = [edge('e1', 'father', 'u', 'PARTNER'), edge('e2', 'u', 'anchor', 'CHILD'), edge('e3', 'u', 'sib', 'CHILD')];
    const r = computeAddRelative(n, e, {
      anchorId: 'anchor', kind: 'parent', person: { newData: data('mother'), newId: 'new1' },
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.edges.find(ed => ed.source === 'new1' && ed.target === 'u' && ed.data?.type === 'PARTNER')).toBeDefined();
    expect(r.pairEdges).toEqual(expect.arrayContaining([
      { fromId: 'new1', toId: 'father', type: 'SPOUSE' },
      { fromId: 'new1', toId: 'anchor', type: 'PARENT' },
      { fromId: 'new1', toId: 'sib', type: 'PARENT' },
    ]));
  });

  it('third parent is rejected (kid1 already has anchor + wife via u1)', () => {
    const r = computeAddRelative(nodes, edges, {
      anchorId: 'kid1', kind: 'parent', person: { newData: data('x'), newId: 'new1' },
    });
    expect(r.ok).toBe(false);
  });

  it('partner joins an existing solo-parent union instead of creating a second one', () => {
    // anchor solo-parents kid1 via u1 (no co-partner yet); adding a partner
    // must attach to u1 (so kid1 stays attached to the marriage), not spawn
    // a second, disconnected union.
    const solo = [charNode('anchor'), unionNode('u1'), charNode('kid1')];
    const soloEdges = [edge('e1', 'anchor', 'u1', 'PARTNER'), edge('e2', 'u1', 'kid1', 'CHILD')];
    const r = computeAddRelative(solo, soloEdges, {
      anchorId: 'anchor', kind: 'partner', person: { newData: data('spouse'), newId: 'new1' },
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.nodes.filter(n => n.type === 'union')).toHaveLength(1);
    expect(r.edges.find(e => e.source === 'new1' && e.target === 'u1' && e.data?.type === 'PARTNER')).toBeDefined();
    expect(r.pairEdges).toEqual(expect.arrayContaining([
      { fromId: 'anchor', toId: 'new1', type: 'SPOUSE' },
      { fromId: 'new1', toId: 'kid1', type: 'PARENT' },
    ]));
  });

  it('partner creates a new union for remarriage (existing union already has 2 partners)', () => {
    const r = computeAddRelative(nodes, edges, {
      anchorId: 'anchor', kind: 'partner', person: { newData: data('newWife'), newId: 'new1' },
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.nodes.filter(n => n.type === 'union')).toHaveLength(2);
    const newUnion = r.nodes.find(n => n.type === 'union' && n.id !== 'u1')!;
    expect(r.edges.find(e => e.source === 'new1' && e.target === newUnion.id)).toBeDefined();
  });

  it('second parent who is already a co-partner does not emit a duplicate SPOUSE', () => {
    // mother & father already partners via u2 (child kid2); father solo-parents anchor via u
    const n = [charNode('father'), charNode('mother'), unionNode('u'), unionNode('u2'),
      charNode('anchor'), charNode('kid2')];
    const e = [
      edge('e1', 'father', 'u', 'PARTNER'), edge('e2', 'u', 'anchor', 'CHILD'),
      edge('e3', 'father', 'u2', 'PARTNER'), edge('e4', 'mother', 'u2', 'PARTNER'), edge('e5', 'u2', 'kid2', 'CHILD'),
    ];
    const r = computeAddRelative(n, e, {
      anchorId: 'anchor', kind: 'parent', person: { existingId: 'mother' },
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.pairEdges.filter(p => p.type === 'SPOUSE')).toHaveLength(0);
    expect(r.pairEdges).toEqual(expect.arrayContaining([
      { fromId: 'mother', toId: 'anchor', type: 'PARENT' },
    ]));
  });
});

describe('partnerUnionsOf', () => {
  it('lists unions with co-partner ids', () => {
    const u = partnerUnionsOf(nodes, edges, 'anchor');
    expect(u).toEqual([{ unionId: 'u1', partnerIds: ['wife'] }]);
  });
});

describe('computeRemoveRelative', () => {
  it('removes a CHILD edge: emits PARENT pairEdges from every partner', () => {
    const r = computeRemoveRelative(nodes, edges, ['e3']);
    if (!r.ok) throw new Error(r.error);
    expect(r.edges.find(e => e.id === 'e3')).toBeUndefined();
    expect(r.pairEdges.sort((a, b) => a.fromId.localeCompare(b.fromId))).toEqual([
      { fromId: 'anchor', toId: 'kid1', type: 'PARENT' },
      { fromId: 'wife', toId: 'kid1', type: 'PARENT' },
    ]);
    expect(r.nodes.find(n => n.id === 'u1')).toBeDefined();
  });

  it('emits ADOPTED pairEdges for adopted children', () => {
    const adoptEdges = [
      edge('e1', 'anchor', 'u1', 'PARTNER'),
      edge('e2', 'wife', 'u1', 'PARTNER'),
      edge('e3', 'u1', 'kid1', 'ADOPTED_CHILD'),
    ];
    const r = computeRemoveRelative(nodes, adoptEdges, ['e3']);
    if (!r.ok) throw new Error(r.error);
    expect(r.pairEdges.sort((a, b) => a.fromId.localeCompare(b.fromId))).toEqual([
      { fromId: 'anchor', toId: 'kid1', type: 'ADOPTED' },
      { fromId: 'wife', toId: 'kid1', type: 'ADOPTED' },
    ]);
  });

  it('removes one PARTNER edge from a 2-partner union with children: full detach', () => {
    const r = computeRemoveRelative(nodes, edges, ['e1']);
    if (!r.ok) throw new Error(r.error);
    expect(r.edges.find(e => e.id === 'e1')).toBeUndefined();
    expect(r.edges.find(e => e.id === 'e2')).toBeDefined();
    expect(r.pairEdges.sort((a, b) => a.type.localeCompare(b.type))).toEqual([
      { fromId: 'anchor', toId: 'kid1', type: 'PARENT' },
      { fromId: 'anchor', toId: 'wife', type: 'SPOUSE' },
    ]);
    expect(r.nodes.find(n => n.id === 'u1')).toBeDefined();
  });

  it('removes the sole PARTNER edge of a childless solo union: garbage-collects the union', () => {
    const soloNodes = [charNode('anchor'), unionNode('u1')];
    const soloEdges = [edge('e1', 'anchor', 'u1', 'PARTNER')];
    const r = computeRemoveRelative(soloNodes, soloEdges, ['e1']);
    if (!r.ok) throw new Error(r.error);
    expect(r.edges).toHaveLength(0);
    expect(r.nodes.find(n => n.id === 'u1')).toBeUndefined();
    expect(r.pairEdges).toEqual([]);
  });

  it('rejects removing the sole PARTNER edge of a solo union with children', () => {
    const soloNodes = [charNode('anchor'), unionNode('u1'), charNode('kid1')];
    const soloEdges = [edge('e1', 'anchor', 'u1', 'PARTNER'), edge('e2', 'u1', 'kid1', 'CHILD')];
    const r = computeRemoveRelative(soloNodes, soloEdges, ['e1']);
    expect(r.ok).toBe(false);
  });

  it('rejects a batch removing both PARTNER edges of a 2-partner union with children', () => {
    const r = computeRemoveRelative(nodes, edges, ['e1', 'e2']);
    expect(r.ok).toBe(false);
  });

  it('dedups pairEdges when a CHILD edge and its union PARTNER edge are removed together', () => {
    const r = computeRemoveRelative(nodes, edges, ['e1', 'e3']);
    if (!r.ok) throw new Error(r.error);
    const parentPairs = r.pairEdges.filter(p => p.type === 'PARENT' && p.fromId === 'anchor' && p.toId === 'kid1');
    expect(parentPairs).toHaveLength(1);
    expect(r.pairEdges.sort((a, b) => (a.fromId + a.type).localeCompare(b.fromId + b.type))).toEqual([
      { fromId: 'anchor', toId: 'kid1', type: 'PARENT' },
      { fromId: 'anchor', toId: 'wife', type: 'SPOUSE' },
      { fromId: 'wife', toId: 'kid1', type: 'PARENT' },
    ]);
  });

  it('removes one PARTNER edge from a childless marriage: garbage-collects the union and other partner edge', () => {
    const testNodes = [charNode('A'), charNode('B'), unionNode('u1')];
    const testEdges = [edge('e1', 'A', 'u1', 'PARTNER'), edge('e2', 'B', 'u1', 'PARTNER')];
    const r = computeRemoveRelative(testNodes, testEdges, ['e1']);
    if (!r.ok) throw new Error(r.error);
    expect(r.nodes.find(n => n.id === 'u1')).toBeUndefined();
    expect(r.edges).toHaveLength(0);
    expect(r.pairEdges).toEqual([{ fromId: 'A', toId: 'B', type: 'SPOUSE' }]);
  });
});

describe('computeDeleteCharacter', () => {
  it('deleting one partner from a childless union: garbage-collects the union and other partner edge', () => {
    const testNodes = [charNode('anchor'), charNode('wife'), unionNode('u1')];
    const testEdges = [edge('e1', 'anchor', 'u1', 'PARTNER'), edge('e2', 'wife', 'u1', 'PARTNER')];
    
    const res = computeDeleteCharacter(testNodes, testEdges, 'anchor');
    expect(res.nodes.map(n => n.id)).toEqual(['wife']);
    expect(res.edges).toEqual([]);
  });

  it('deleting one partner from a union with a child: keeps the union as a solo-parent union', () => {
    const testNodes = [charNode('anchor'), charNode('wife'), unionNode('u1'), charNode('kid1')];
    const testEdges = [
      edge('e1', 'anchor', 'u1', 'PARTNER'),
      edge('e2', 'wife', 'u1', 'PARTNER'),
      edge('e3', 'u1', 'kid1', 'CHILD')
    ];

    const res = computeDeleteCharacter(testNodes, testEdges, 'anchor');
    expect(res.nodes.map(n => n.id).sort()).toEqual(['kid1', 'u1', 'wife']);
    expect(res.edges.map(e => e.id).sort()).toEqual(['e2', 'e3']);
  });

  it('deleting a solo parent: garbage-collects the union and child edge, leaving the child standalone', () => {
    const testNodes = [charNode('anchor'), unionNode('u1'), charNode('kid1')];
    const testEdges = [edge('e1', 'anchor', 'u1', 'PARTNER'), edge('e2', 'u1', 'kid1', 'CHILD')];

    const res = computeDeleteCharacter(testNodes, testEdges, 'anchor');
    expect(res.nodes.map(n => n.id)).toEqual(['kid1']);
    expect(res.edges).toEqual([]);
  });

  it('deleting a child: keeps the union for parents', () => {
    const testNodes = [charNode('anchor'), charNode('wife'), unionNode('u1'), charNode('kid1')];
    const testEdges = [
      edge('e1', 'anchor', 'u1', 'PARTNER'),
      edge('e2', 'wife', 'u1', 'PARTNER'),
      edge('e3', 'u1', 'kid1', 'CHILD')
    ];

    const res = computeDeleteCharacter(testNodes, testEdges, 'kid1');
    expect(res.nodes.map(n => n.id).sort()).toEqual(['anchor', 'u1', 'wife']);
    expect(res.edges.map(e => e.id).sort()).toEqual(['e1', 'e2']);
  });
});

describe('relativeContext', () => {
  const union = (id: string) => ({ unionId: id, partnerIds: ['p1'] });

  it('offers nothing extra for a parent', () => {
    expect(relativeContext('parent', [])).toEqual({ showUnionChoice: false });
  });

  it('offers nothing extra for a partner, even with unions present', () => {
    expect(relativeContext('partner', [union('u1'), union('u2')])).toEqual({
      showUnionChoice: false,
    });
  });

  it('asks nothing extra for a child of a single union', () => {
    // Adoption is no longer asked here — the Adopted trait in the character
    // form carries it, so one checkbox sets both the badge and the edge.
    expect(relativeContext('child', [])).toEqual({
      showUnionChoice: false,
      defaultUnionId: undefined,
    });
  });

  it('picks the only union silently', () => {
    const ctx = relativeContext('child', [union('u1')]);
    expect(ctx.showUnionChoice).toBe(false);
    expect(ctx.defaultUnionId).toBe('u1');
  });

  it('asks which partner when there is more than one union', () => {
    const ctx = relativeContext('child', [union('u1'), union('u2')]);
    expect(ctx.showUnionChoice).toBe(true);
    expect(ctx.defaultUnionId).toBeUndefined();
  });
});

