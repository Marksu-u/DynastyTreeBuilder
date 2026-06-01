// lib/migrate-canvas.ts
import type { Node, Edge } from '@xyflow/react';
import type { CharacterData, RelationshipData, UnionData } from '@/types/canvas';

type AnyNode = Node<CharacterData, 'character'> | Node<UnionData, 'union'>;
type AnyEdge = Edge<RelationshipData, 'relationship'>;

export function migrateCanvas(
  nodes: AnyNode[],
  edges: AnyEdge[],
): { nodes: AnyNode[]; edges: AnyEdge[] } {
  if (nodes.some(n => n.type === 'union')) return { nodes, edges };

  const newNodes: AnyNode[] = [...nodes];
  const newEdges: AnyEdge[] = [];

  // Map: characterId → unionId (for unions this character is a partner of)
  const charToUnion = new Map<string, string>();
  // Track children already added to a union to avoid duplicates
  const unionChildren = new Map<string, Set<string>>();

  // Step 1: Convert SPOUSE edges → union nodes + PARTNER edges
  for (const e of edges) {
    if ((e.data?.type as unknown as string) !== 'SPOUSE') continue;
    const nodeA = nodes.find(n => n.id === e.source);
    const nodeB = nodes.find(n => n.id === e.target);
    if (!nodeA || !nodeB) continue;

    const unionId = crypto.randomUUID();
    const x = (nodeA.position.x + nodeB.position.x) / 2;
    const y = Math.max(nodeA.position.y, nodeB.position.y) + 40;

    newNodes.push({ id: unionId, type: 'union', position: { x, y }, data: {} });
    unionChildren.set(unionId, new Set());
    charToUnion.set(e.source, unionId);
    charToUnion.set(e.target, unionId);

    newEdges.push(makeEdge(e.source, unionId, 'PARTNER'));
    newEdges.push(makeEdge(e.target, unionId, 'PARTNER'));
  }

  // Step 2: Convert PARENT / ADOPTED edges → CHILD / ADOPTED_CHILD through union
  for (const e of edges) {
    const edgeType = e.data?.type as unknown as string;
    if (edgeType !== 'PARENT' && edgeType !== 'ADOPTED') continue;
    const clientType = edgeType === 'ADOPTED' ? 'ADOPTED_CHILD' : 'CHILD';
    const parentId = e.source;
    const childId = e.target;

    let unionId = charToUnion.get(parentId);

    if (!unionId) {
      // Single-parent union
      const parentNode = nodes.find(n => n.id === parentId);
      if (!parentNode) continue;
      unionId = crypto.randomUUID();
      newNodes.push({
        id: unionId, type: 'union',
        position: { x: parentNode.position.x, y: parentNode.position.y + 80 },
        data: {},
      });
      unionChildren.set(unionId, new Set());
      charToUnion.set(parentId, unionId);
      newEdges.push(makeEdge(parentId, unionId, 'PARTNER'));
    }

    // Avoid duplicate child edges
    const children = unionChildren.get(unionId)!;
    if (children.has(childId)) continue;
    children.add(childId);
    newEdges.push(makeEdge(unionId, childId, clientType));
  }

  return { nodes: newNodes, edges: newEdges };
}

function makeEdge(source: string, target: string, type: string): AnyEdge {
  return {
    id: crypto.randomUUID(),
    type: 'relationship',
    source,
    target,
    data: { type: type as RelationshipData['type'], isMutual: false },
  };
}
