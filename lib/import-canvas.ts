// lib/import-canvas.ts
// Reads/writes the DynastyExport JSON format used by both canvases' "Download
// JSON" / "Import JSON" features. Two directions:
//   - buildCanvasFromExport: file → renderable union-model nodes/edges (used
//     by the guest canvas's client-side import)
//   - deriveExportRelationships: current union-model graph → self-consistent
//     legacy pair edges (used by the guest canvas's export, so a downloaded
//     file never references a union-node id that isn't in `characters[]`)
import { migrateCanvas } from '@/lib/migrate-canvas';
import { DynastyExportSchema, type DynastyExport } from '@/lib/schemas';
import type { AnyCanvasNode, RelationshipEdgeType } from '@/store/canvas';
import type { CharacterData, RelationshipData, UnionData } from '@/types/canvas';
import type { PairEdge } from '@/lib/relative-ops';
import type { Node, Edge } from '@xyflow/react';

type AnyNode = Node<CharacterData, 'character'> | Node<UnionData, 'union'>;
type AnyEdge = Edge<RelationshipData, 'relationship'>;

export function parseImportFile(raw: string): DynastyExport {
  return DynastyExportSchema.parse(JSON.parse(raw));
}

export function buildCanvasFromExport(data: DynastyExport): { nodes: AnyNode[]; edges: AnyEdge[] } {
  const characterIds = new Set(data.characters.map(c => c.id));

  const characterNodes: AnyNode[] = data.characters.map(c => ({
    id: c.id,
    type: 'character' as const,
    position: { x: c.posX, y: c.posY },
    data: {
      name: c.name,
      alias: c.alias ?? undefined,
      flags: c.flags,
      style: c.style,
      gender: c.gender,
      note: c.note ?? undefined,
    },
  }));

  // Repair dangling references: a relationship whose fromId/toId isn't a real
  // character must be a union-node id the file's export step omitted (a bug
  // in pre-2026-07-06 guest exports). Synthesize a placeholder union node for
  // each distinct dangling id so migrateCanvas's own
  // `nodes.some(n => n.type === 'union')` guard treats the graph as already
  // migrated, passing every edge through unchanged instead of trying (and
  // failing) to re-derive unions from legacy types that aren't present.
  const danglingIds = new Set<string>();
  for (const r of data.relationships) {
    if (!characterIds.has(r.fromId)) danglingIds.add(r.fromId);
    if (!characterIds.has(r.toId)) danglingIds.add(r.toId);
  }
  const unionNodes: AnyNode[] = [...danglingIds].map(id => ({
    id, type: 'union' as const, position: { x: 0, y: 0 }, data: {},
  }));

  const edges: AnyEdge[] = data.relationships.map(r => ({
    id: r.id,
    type: 'relationship' as const,
    source: r.fromId,
    target: r.toId,
    data: {
      type: r.type as RelationshipData['type'],
      hook: r.hook ?? undefined,
      isMutual: r.isMutual,
    },
  }));

  return migrateCanvas([...characterNodes, ...unionNodes], edges);
}

export function deriveExportRelationships(
  nodes: AnyCanvasNode[],
  edges: RelationshipEdgeType[],
): PairEdge[] {
  const unionIds = new Set(nodes.filter(n => n.type === 'union').map(n => n.id));
  const pairs: PairEdge[] = [];

  for (const unionId of unionIds) {
    const partnerIds = edges.filter(e => e.target === unionId && e.data?.type === 'PARTNER').map(e => e.source);
    const childIds = edges.filter(e => e.source === unionId && e.data?.type === 'CHILD').map(e => e.target);
    const adoptedIds = edges.filter(e => e.source === unionId && e.data?.type === 'ADOPTED_CHILD').map(e => e.target);

    if (partnerIds.length === 2) {
      pairs.push({ fromId: partnerIds[0], toId: partnerIds[1], type: 'SPOUSE' });
    }
    for (const parentId of partnerIds) {
      for (const childId of childIds) pairs.push({ fromId: parentId, toId: childId, type: 'PARENT' });
      for (const adoptedId of adoptedIds) pairs.push({ fromId: parentId, toId: adoptedId, type: 'ADOPTED' });
    }
  }

  return pairs;
}

/**
 * Builds a guest export file. Lives here rather than in the canvas component so
 * the "does our own parser accept what we write" round-trip is testable.
 */
export function buildGuestExport(
  nodes: AnyCanvasNode[],
  edges: RelationshipEdgeType[],
  house: { name: string; setting: DynastyExport['dynasty']['setting']; crestSeed: string },
): DynastyExport {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    dynasty: {
      name: house.name,
      setting: house.setting,
      // Guest trees have no share link, so there is nothing to publish.
      isPublic: false,
      // Empty means the arms were never minted (the SSR-safe initial state).
      // CrestSeedSchema rejects '', so write null rather than an invalid seed.
      crestSeed: house.crestSeed || null,
    },
    characters: nodes
      .filter((n): n is Extract<AnyCanvasNode, { type: 'character' }> => n.type === 'character')
      .map(n => ({
        id: n.id,
        name: n.data.name,
        alias: n.data.alias ?? null,
        flags: n.data.flags ?? [],
        style: n.data.style,
        gender: n.data.gender,
        note: n.data.note ?? null,
        posX: n.position.x,
        posY: n.position.y,
      })),
    relationships: deriveExportRelationships(nodes, edges).map(r => ({
      id: crypto.randomUUID(),
      fromId: r.fromId,
      toId: r.toId,
      type: r.type,
      hook: null,
      isMutual: false,
    })),
  };
}
