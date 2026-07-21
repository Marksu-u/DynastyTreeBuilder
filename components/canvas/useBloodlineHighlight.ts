"use client";

import { useCallback, useMemo, useState } from 'react';
import { buildFamilyGraph } from '@/lib/genealogy-layout';
import { bloodlineHighlight } from '@/lib/descendant-subtree';
import type { BloodlineEntry } from '@/lib/descendant-subtree';
import type { AnyCanvasNode, RelationshipEdgeType } from '@/store/canvas';
import type { HighlightContextValue } from './HighlightContext';

export interface BloodlineHighlightApi extends HighlightContextValue {
  onNodeMouseEnter: (e: React.MouseEvent, node: AnyCanvasNode) => void;
  onNodeMouseLeave: () => void;
}

/** The union a connector belongs to: a PARTNER edge points at it, a child edge
 *  comes from it. */
function unionOfEdge(edge: RelationshipEdgeType): string | null {
  const t = edge.data?.type;
  if (t === 'PARTNER') return edge.target;
  if (t === 'CHILD' || t === 'ADOPTED_CHILD') return edge.source;
  return null;
}

/** Hover highlighting of a lineage spine: ancestors, descendants, the spouses
 *  attached to both, and every union linking them. */
export function useBloodlineHighlight(
  nodes: AnyCanvasNode[],
  edges: RelationshipEdgeType[],
): BloodlineHighlightApi {
  const [hoveredChar, setHoveredChar] = useState<string | null>(null);

  const graph = useMemo(() => buildFamilyGraph(nodes, edges), [nodes, edges]);

  const { chars, edgeMap } = useMemo(() => {
    if (!hoveredChar || !graph.characterIds.includes(hoveredChar)) {
      return { chars: null, edgeMap: null };
    }
    const active = bloodlineHighlight(graph, hoveredChar);

    const edgeMap = new Map<string, BloodlineEntry>();
    for (const e of edges) {
      const uid = unionOfEdge(e);
      if (!uid) continue;
      const entry = active.unions.get(uid);
      if (entry) edgeMap.set(e.id, entry);
    }
    return { chars: active.chars, edgeMap };
  }, [hoveredChar, graph, edges]);

  const onNodeMouseEnter = useCallback((_e: React.MouseEvent, node: AnyCanvasNode) => {
    if (node.type === 'character') setHoveredChar(node.id);
  }, []);
  const onNodeMouseLeave = useCallback(() => setHoveredChar(null), []);

  return { chars, edges: edgeMap, onNodeMouseEnter, onNodeMouseLeave };
}
