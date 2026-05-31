"use client";

import { memo } from 'react';
import {
  BaseEdge,
  EdgeProps,
  Edge,
  getSmoothStepPath,
} from '@xyflow/react';
import type { RelationshipData } from '@/types/canvas';

export type RelationshipEdgeType = Edge<RelationshipData, 'relationship'>;

const EDGE_STYLES: Record<string, React.CSSProperties> = {
  PARENT:  { stroke: '#534AB7', strokeWidth: 1.5 },
  SPOUSE:  { stroke: '#888780', strokeWidth: 1 },
  ADOPTED: { stroke: '#0F6E56', strokeWidth: 1, strokeDasharray: '4 3' },
};

const FALLBACK_STYLE: React.CSSProperties = { stroke: '#52525b', strokeWidth: 1.5 };

export const RelationshipEdge = memo(({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
}: EdgeProps<RelationshipEdgeType>) => {
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  });

  const relType = data?.type ?? 'PARENT';
  const baseStyle = EDGE_STYLES[relType] ?? FALLBACK_STYLE;

  const style: React.CSSProperties = {
    ...baseStyle,
    opacity: selected ? 1 : 0.7,
    filter: selected ? 'drop-shadow(0 0 4px currentColor)' : undefined,
  };

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={style}
      markerEnd={markerEnd}
      interactionWidth={20}
    />
  );
});

RelationshipEdge.displayName = 'RelationshipEdge';
