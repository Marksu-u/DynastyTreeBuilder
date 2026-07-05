// lib/relative-ops.ts
// Pure add-relative logic shared by the guest store and the DB canvas.
// Produces both the union-model graph delta AND the legacy pair edges the
// DB persists (SPOUSE / PARENT / ADOPTED — see app/actions/relationship.ts).

import { buildFamilyGraph } from '@/lib/genealogy-layout';
import type { AnyCanvasNode, CharacterNodeType, UnionNodeType, RelationshipEdgeType } from '@/store/canvas';
import type { CharacterData, RelationshipType } from '@/types/canvas';

export type RelativeKind = 'partner' | 'child' | 'parent';

export interface AddRelativeInput {
  anchorId: string;
  kind: RelativeKind;
  person: { newData: CharacterData; newId: string } | { existingId: string };
  adopted?: boolean;   // child only
  unionId?: string;    // child only — required when the anchor has several unions
}

export interface PairEdge { fromId: string; toId: string; type: 'SPOUSE' | 'PARENT' | 'ADOPTED' }

export type AddRelativeResult =
  | { ok: true; nodes: AnyCanvasNode[]; edges: RelationshipEdgeType[]; pairEdges: PairEdge[]; personId: string }
  | { ok: false; error: string };

export function partnerUnionsOf(
  nodes: AnyCanvasNode[], edges: RelationshipEdgeType[], personId: string,
): { unionId: string; partnerIds: string[] }[] {
  const graph = buildFamilyGraph(nodes, edges);
  return (graph.partnerUnions.get(personId) ?? []).map(u => ({
    unionId: u.id,
    partnerIds: u.partners.filter(p => p !== personId),
  }));
}

function relEdge(source: string, target: string, type: RelationshipType): RelationshipEdgeType {
  return { id: crypto.randomUUID(), type: 'relationship', source, target, data: { type, isMutual: false } };
}

export function computeAddRelative(
  nodes: AnyCanvasNode[],
  edges: RelationshipEdgeType[],
  input: AddRelativeInput,
): AddRelativeResult {
  const anchor = nodes.find(n => n.id === input.anchorId && n.type === 'character');
  if (!anchor) return { ok: false, error: 'Character not found' };

  const graph = buildFamilyGraph(nodes, edges);

  // resolve the person
  let personId: string;
  let newNode: CharacterNodeType | null = null;
  if ('existingId' in input.person) {
    personId = input.person.existingId;
    if (personId === input.anchorId) return { ok: false, error: "Can't link a character to themselves" };
    if (!nodes.some(n => n.id === personId && n.type === 'character')) {
      return { ok: false, error: 'Character not found' };
    }
  } else {
    personId = input.person.newId;
    newNode = { id: personId, type: 'character', position: { x: 0, y: 0 }, data: input.person.newData };
  }

  const addedNodes: AnyCanvasNode[] = newNode ? [newNode] : [];
  const addedEdges: RelationshipEdgeType[] = [];
  const pairEdges: PairEdge[] = [];

  if (input.kind === 'partner') {
    const anchorUnions = graph.partnerUnions.get(input.anchorId) ?? [];
    const already = anchorUnions.some(u => u.partners.includes(personId));
    if (already) return { ok: false, error: 'Already partners' };

    // If the anchor already solo-parents via one existing union (no co-partner
    // yet), join that union rather than spawning a second, disconnected one —
    // otherwise any existing children would be orphaned from the new marriage.
    const soloUnion = anchorUnions.length === 1 && anchorUnions[0].partners.length === 1
      ? anchorUnions[0]
      : undefined;

    if (soloUnion) {
      addedEdges.push(relEdge(personId, soloUnion.id, 'PARTNER'));
      pairEdges.push({ fromId: input.anchorId, toId: personId, type: 'SPOUSE' });
      for (const c of soloUnion.children) {
        pairEdges.push({ fromId: personId, toId: c, type: 'PARENT' });
      }
    } else {
      const unionId = crypto.randomUUID();
      const unionNode: UnionNodeType = { id: unionId, type: 'union', position: { x: 0, y: 0 }, data: {} };
      addedNodes.push(unionNode);
      addedEdges.push(relEdge(input.anchorId, unionId, 'PARTNER'), relEdge(personId, unionId, 'PARTNER'));
      pairEdges.push({ fromId: input.anchorId, toId: personId, type: 'SPOUSE' });
    }

  } else if (input.kind === 'child') {
    const unions = graph.partnerUnions.get(input.anchorId) ?? [];
    let union = input.unionId ? unions.find(u => u.id === input.unionId) : undefined;
    if (!union) {
      if (input.unionId) return { ok: false, error: 'Union not found' };
      if (unions.length > 1) return { ok: false, error: 'AMBIGUOUS_UNION' };
      union = unions[0];
    }
    let unionId: string;
    let unionPartners: string[];
    if (union) {
      if (union.children.includes(personId)) return { ok: false, error: 'Already a child of this union' };
      if (union.partners.includes(personId)) return { ok: false, error: "A partner can't also be a child of the same union" };
      unionId = union.id;
      unionPartners = union.partners;
    } else {
      // solo-parent union
      unionId = crypto.randomUUID();
      const unionNode: UnionNodeType = { id: unionId, type: 'union', position: { x: 0, y: 0 }, data: {} };
      addedNodes.push(unionNode);
      addedEdges.push(relEdge(input.anchorId, unionId, 'PARTNER'));
      unionPartners = [input.anchorId];
    }
    addedEdges.push(relEdge(unionId, personId, input.adopted ? 'ADOPTED_CHILD' : 'CHILD'));
    for (const p of unionPartners) {
      pairEdges.push({ fromId: p, toId: personId, type: input.adopted ? 'ADOPTED' : 'PARENT' });
    }

  } else {
    // parent
    if (personId === input.anchorId) return { ok: false, error: "Can't link a character to themselves" };
    const parentUnions = graph.parentUnions.get(input.anchorId) ?? [];
    const existing = parentUnions[0]; // deterministic: first parent union owns the slot
    if (existing && existing.partners.length >= 2) {
      return { ok: false, error: 'Both parents are already set' };
    }
    if (existing) {
      if (existing.partners.includes(personId)) return { ok: false, error: 'Already a parent' };
      addedEdges.push(relEdge(personId, existing.id, 'PARTNER'));
      for (const p of existing.partners) {
        // Skip the SPOUSE pair edge if they're already partners in another union —
        // migrate-canvas builds one union per SPOUSE edge, so a duplicate row
        // would materialize as a phantom second marriage on reload.
        const alreadyPartners = (graph.partnerUnions.get(personId) ?? []).some(u => u.partners.includes(p));
        if (!alreadyPartners) pairEdges.push({ fromId: personId, toId: p, type: 'SPOUSE' });
      }
      for (const c of existing.children) pairEdges.push({ fromId: personId, toId: c, type: 'PARENT' });
    } else {
      const unionId = crypto.randomUUID();
      const unionNode: UnionNodeType = { id: unionId, type: 'union', position: { x: 0, y: 0 }, data: {} };
      addedNodes.push(unionNode);
      addedEdges.push(relEdge(personId, unionId, 'PARTNER'), relEdge(unionId, input.anchorId, 'CHILD'));
      pairEdges.push({ fromId: personId, toId: input.anchorId, type: 'PARENT' });
    }
  }

  return {
    ok: true,
    nodes: [...nodes, ...addedNodes],
    edges: [...edges, ...addedEdges],
    pairEdges,
    personId,
  };
}
