"use client";

import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  Edge,
  getBezierPath,
} from '@xyflow/react';
import type { RelationshipData } from '@/types/canvas';
import { useCatalog } from './CatalogProvider';

export type RelationshipEdgeType = Edge<RelationshipData, 'relationship'>;

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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  });

  const { resolve } = useCatalog();

  const relType = data?.type ?? 'UNKNOWN';
  const typeOption = resolve('RELATIONSHIP_TYPE', relType);

  // For custom types with a hex color, derive edge color from it
  const customStroke = typeOption.isCustom && typeOption.color?.startsWith('#')
    ? typeOption.color
    : undefined;

  const style: React.CSSProperties = {
    ...(customStroke
      ? { stroke: customStroke, strokeWidth: 1.5 }
      : typeOption.edgeStyle),
    opacity: selected ? 1 : 0.7,
    filter: selected ? 'drop-shadow(0 0 4px currentColor)' : undefined,
  };

  const tagLabel = data?.tag
    ? resolve('RELATIONSHIP_TAG', data.tag).label.toLowerCase()
    : null;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
        interactionWidth={20}
      />
      {tagLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
              position: 'absolute',
            }}
          >
            <span className="rounded border border-zinc-700 bg-zinc-900/90 px-1.5 py-0.5 text-[10px] text-zinc-400">
              {tagLabel}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

RelationshipEdge.displayName = 'RelationshipEdge';
