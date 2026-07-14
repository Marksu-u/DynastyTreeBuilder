"use client";

import { useMemo } from 'react';
import { layoutGenealogy, type GenerationRow } from '@/lib/genealogy-layout';
import type { AnyCanvasNode, RelationshipEdgeType } from '@/store/canvas';

/**
 * Derives every node position from the relationship structure. Union nodes
 * are made non-interactive here (single place) — they are pure routing points.
 */
export function useGenealogyLayout(
  nodes: AnyCanvasNode[],
  edges: RelationshipEdgeType[],
): { nodes: AnyCanvasNode[]; rows: GenerationRow[] } {
  return useMemo(() => {
    const { positions, rows, railLevels } = layoutGenealogy(nodes, edges);
    const laidOut = nodes.map(n => ({
      ...n,
      position: positions[n.id] ?? n.position,
      ...(n.type === 'union'
        ? {
            selectable: false, focusable: false, deletable: false,
            data: { ...n.data, railLevel: railLevels[n.id] ?? 0 },
          }
        : {}),
    })) as AnyCanvasNode[];
    return { nodes: laidOut, rows };
  }, [nodes, edges]);
}
