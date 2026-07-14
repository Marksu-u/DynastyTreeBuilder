"use client";

import { useCallback, useMemo, useState } from 'react';
import type { NodeMouseHandler } from '@xyflow/react';
import { buildFamilyGraph } from '@/lib/genealogy-layout';
import { descendantSubtree } from '@/lib/descendant-subtree';
import type { AnyCanvasNode, RelationshipEdgeType } from '@/store/canvas';
import type { HighlightContextValue } from './HighlightContext';

export interface DescendantHighlight extends HighlightContextValue {
  onNodeMouseEnter: NodeMouseHandler<AnyCanvasNode>;
  onNodeMouseLeave: NodeMouseHandler<AnyCanvasNode>;
}

export function useDescendantHighlight(
  nodes: AnyCanvasNode[],
  edges: RelationshipEdgeType[],
): DescendantHighlight {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const graph = useMemo(() => buildFamilyGraph(nodes, edges), [nodes, edges]);

  const { activeCharIds, activeEdgeIds } = useMemo<HighlightContextValue>(() => {
    if (!hoveredId || !graph.characterIds.includes(hoveredId)) {
      return { activeCharIds: null, activeEdgeIds: null };
    }
    const { charIds, unionIds } = descendantSubtree(graph, hoveredId);
    if (unionIds.size === 0) return { activeCharIds: null, activeEdgeIds: null };

    const edgeIds = new Set<string>();
    for (const e of edges) {
      const t = e.data?.type;
      if (t === 'PARTNER' && unionIds.has(e.target)) edgeIds.add(e.id);
      else if ((t === 'CHILD' || t === 'ADOPTED_CHILD') && unionIds.has(e.source)) edgeIds.add(e.id);
    }
    return { activeCharIds: charIds, activeEdgeIds: edgeIds };
  }, [hoveredId, graph, edges]);

  const onNodeMouseEnter = useCallback<NodeMouseHandler<AnyCanvasNode>>((_e, node) => {
    if (node.type === 'character') setHoveredId(node.id);
  }, []);
  const onNodeMouseLeave = useCallback<NodeMouseHandler<AnyCanvasNode>>(() => {
    setHoveredId(null);
  }, []);

  return { activeCharIds, activeEdgeIds, onNodeMouseEnter, onNodeMouseLeave };
}
