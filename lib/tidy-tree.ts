// lib/tidy-tree.ts
import dagre from '@dagrejs/dagre';

type CharacterNodeType = { id: string; type: 'character'; position: { x: number; y: number }; data: unknown };
type UnionNodeType = { id: string; type: 'union'; position: { x: number; y: number }; data: unknown };
type RelationshipEdgeType = { id: string; type: 'relationship'; source: string; target: string; data?: { type?: string } };

const H_SEP = 240;
const V_SEP = 160;
const NODE_W = 180;
const NODE_H = 60;

/**
 * Runs dagre layout on the graph. Returns a map of characterId → new {x, y}.
 * Union nodes are excluded — their positions are always computed from parent positions.
 */
export function tidyTree(
  nodes: (CharacterNodeType | UnionNodeType)[],
  edges: RelationshipEdgeType[],
): Record<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: H_SEP, ranksep: V_SEP });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_W, height: NODE_H });
  }

  for (const edge of edges) {
    if (edge.data?.type === 'PARTNER') {
      g.setEdge(edge.source, edge.target);
    } else if (edge.data?.type === 'CHILD' || edge.data?.type === 'ADOPTED_CHILD') {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  const result: Record<string, { x: number; y: number }> = {};
  for (const node of nodes) {
    if (node.type !== 'character') continue;
    const laid = g.node(node.id);
    if (laid) result[node.id] = { x: laid.x - NODE_W / 2, y: laid.y - NODE_H / 2 };
  }
  return result;
}
