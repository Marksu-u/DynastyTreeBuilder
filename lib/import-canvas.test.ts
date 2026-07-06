import { describe, it, expect } from 'vitest';
import { parseImportFile, buildCanvasFromExport, deriveExportRelationships } from './import-canvas';
import type { AnyCanvasNode, RelationshipEdgeType } from '@/store/canvas';
import type { DynastyExport } from '@/lib/schemas';

const baseExport = (overrides: Partial<DynastyExport> = {}): DynastyExport => ({
  version: 1,
  exportedAt: '2026-07-06T00:00:00.000Z',
  dynasty: { name: 'Test', setting: 'FANTASY', isPublic: false },
  characters: [],
  relationships: [],
  ...overrides,
});

const char = (id: string, name: string) => ({
  id, name, alias: null, flags: [], style: 'OTHER', gender: 'UNKNOWN' as const, note: null, posX: 0, posY: 0,
});

describe('parseImportFile', () => {
  it('parses a valid export', () => {
    const raw = JSON.stringify(baseExport({ characters: [char('a', 'Aegon')] }));
    expect(parseImportFile(raw).characters).toHaveLength(1);
  });

  it('throws on malformed JSON', () => {
    expect(() => parseImportFile('{not json')).toThrow();
  });

  it('throws on wrong version', () => {
    const raw = JSON.stringify(baseExport({ version: 2 as never }));
    expect(() => parseImportFile(raw)).toThrow();
  });

  it('throws on missing required character field', () => {
    const raw = JSON.stringify({ ...baseExport(), characters: [{ id: 'a' }] });
    expect(() => parseImportFile(raw)).toThrow();
  });

  it('accepts a freeform (non-token) role/style', () => {
    const raw = JSON.stringify(baseExport({
      characters: [{ ...char('a', 'Aegon'), style: 'Head of House' }],
    }));
    expect(() => parseImportFile(raw)).not.toThrow();
  });

  it('accepts an empty style (character with no role set)', () => {
    const raw = JSON.stringify(baseExport({
      characters: [{ ...char('a', 'Aegon'), style: '' }],
    }));
    expect(() => parseImportFile(raw)).not.toThrow();
  });
});

describe('buildCanvasFromExport', () => {
  it('reconstructs a self-consistent (DB-vocabulary) export with no repair needed', () => {
    const data = baseExport({
      characters: [char('dad', 'Dad'), char('mom', 'Mom'), char('kid', 'Kid')],
      relationships: [
        { id: 'r1', fromId: 'dad', toId: 'mom', type: 'SPOUSE', hook: null, isMutual: false },
        { id: 'r2', fromId: 'dad', toId: 'kid', type: 'PARENT', hook: null, isMutual: false },
        { id: 'r3', fromId: 'mom', toId: 'kid', type: 'PARENT', hook: null, isMutual: false },
      ],
    });
    const { nodes, edges } = buildCanvasFromExport(data);
    expect(nodes.filter(n => n.type === 'character')).toHaveLength(3);
    expect(nodes.filter(n => n.type === 'union')).toHaveLength(1);
    expect(edges.filter(e => e.data?.type === 'PARTNER').map(e => e.source).sort()).toEqual(['dad', 'mom']);
    const childEdges = edges.filter(e => e.data?.type === 'CHILD');
    expect(childEdges).toHaveLength(1);
    expect(childEdges[0].target).toBe('kid');
  });

  it('repairs a pre-fix guest export whose relationships dangle to a missing union id', () => {
    // Simulates the OLD buggy guest export: characters[] has no union entry,
    // but relationships reference a union id ('u1') directly.
    const data = baseExport({
      characters: [char('dad', 'Dad'), char('mom', 'Mom'), char('kid', 'Kid')],
      relationships: [
        { id: 'r1', fromId: 'dad', toId: 'u1', type: 'PARTNER', hook: null, isMutual: false },
        { id: 'r2', fromId: 'mom', toId: 'u1', type: 'PARTNER', hook: null, isMutual: false },
        { id: 'r3', fromId: 'u1', toId: 'kid', type: 'CHILD', hook: null, isMutual: false },
      ],
    });
    const { nodes, edges } = buildCanvasFromExport(data);
    expect(nodes.filter(n => n.type === 'union')).toHaveLength(1);
    expect(nodes.find(n => n.id === 'u1')).toBeDefined();
    expect(edges.filter(e => e.data?.type === 'PARTNER').map(e => e.source).sort()).toEqual(['dad', 'mom']);
    const childEdges = edges.filter(e => e.data?.type === 'CHILD');
    expect(childEdges).toHaveLength(1);
    expect(childEdges[0].target).toBe('kid');
  });

  it('preserves the adopted-child distinction on reconstruction', () => {
    const data = baseExport({
      characters: [char('p', 'Parent'), char('kid', 'Kid')],
      relationships: [{ id: 'r1', fromId: 'p', toId: 'kid', type: 'ADOPTED', hook: null, isMutual: false }],
    });
    const { edges } = buildCanvasFromExport(data);
    expect(edges.filter(e => e.data?.type === 'ADOPTED_CHILD')).toHaveLength(1);
  });
});

describe('deriveExportRelationships', () => {
  const charNode = (id: string): AnyCanvasNode =>
    ({ id, type: 'character', position: { x: 0, y: 0 }, data: { name: id, flags: [], style: 'OTHER', gender: 'UNKNOWN' } });
  const unionNode = (id: string): AnyCanvasNode =>
    ({ id, type: 'union', position: { x: 0, y: 0 }, data: {} });
  const edge = (id: string, source: string, target: string, type: 'PARTNER' | 'CHILD' | 'ADOPTED_CHILD'): RelationshipEdgeType =>
    ({ id, type: 'relationship', source, target, data: { type, isMutual: false } });

  it('derives SPOUSE + PARENT from a couple with one child', () => {
    const nodes = [charNode('dad'), charNode('mom'), unionNode('u1'), charNode('kid')];
    const edges = [edge('e1', 'dad', 'u1', 'PARTNER'), edge('e2', 'mom', 'u1', 'PARTNER'), edge('e3', 'u1', 'kid', 'CHILD')];
    const pairs = deriveExportRelationships(nodes, edges);
    expect(pairs).toEqual(expect.arrayContaining([
      { fromId: 'dad', toId: 'mom', type: 'SPOUSE' },
      { fromId: 'dad', toId: 'kid', type: 'PARENT' },
      { fromId: 'mom', toId: 'kid', type: 'PARENT' },
    ]));
    const charIds = new Set(['dad', 'mom', 'kid']);
    for (const p of pairs) {
      expect(charIds.has(p.fromId)).toBe(true);
      expect(charIds.has(p.toId)).toBe(true);
    }
  });

  it('derives ADOPTED for an adopted child, distinct from PARENT', () => {
    const nodes = [charNode('p'), unionNode('u1'), charNode('kid')];
    const edges = [edge('e1', 'p', 'u1', 'PARTNER'), edge('e2', 'u1', 'kid', 'ADOPTED_CHILD')];
    expect(deriveExportRelationships(nodes, edges)).toEqual([{ fromId: 'p', toId: 'kid', type: 'ADOPTED' }]);
  });

  it('round-trips through buildCanvasFromExport (export → import → same structure)', () => {
    const nodes = [charNode('dad'), charNode('mom'), unionNode('u1'), charNode('kid')];
    const edges = [edge('e1', 'dad', 'u1', 'PARTNER'), edge('e2', 'mom', 'u1', 'PARTNER'), edge('e3', 'u1', 'kid', 'CHILD')];
    const pairs = deriveExportRelationships(nodes, edges);
    const data = baseExport({
      characters: [char('dad', 'dad'), char('mom', 'mom'), char('kid', 'kid')],
      relationships: pairs.map((p, i) => ({ id: `r${i}`, fromId: p.fromId, toId: p.toId, type: p.type, hook: null, isMutual: false })),
    });
    const rebuilt = buildCanvasFromExport(data);
    expect(rebuilt.nodes.filter(n => n.type === 'union')).toHaveLength(1);
    expect(rebuilt.edges.filter(e => e.data?.type === 'PARTNER').map(e => e.source).sort()).toEqual(['dad', 'mom']);
    expect(rebuilt.edges.filter(e => e.data?.type === 'CHILD').map(e => e.target)).toEqual(['kid']);
  });
});
