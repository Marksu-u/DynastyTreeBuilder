"use client";

import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  Edge,
  getBezierPath,
} from '@xyflow/react';
import type { RelationshipData, RelationshipType, RelationshipTag } from '@/types/canvas';

export type RelationshipEdgeType = Edge<RelationshipData, 'relationship'>;

const EDGE_STYLES: Record<RelationshipType, React.CSSProperties> = {
  BLOOD:    { stroke: '#a1a1aa', strokeWidth: 2 },
  ADOPTED:  { stroke: '#60a5fa', strokeWidth: 2, strokeDasharray: '6 4' },
  MARRIED:  { stroke: '#fb7185', strokeWidth: 2 },
  BETROTHED:{ stroke: '#fda4af', strokeWidth: 1.5, strokeDasharray: '4 4' },
  ALLY:     { stroke: '#4ade80', strokeWidth: 1.5, strokeDasharray: '3 3' },
  ENEMY:    { stroke: '#f87171', strokeWidth: 2 },
  MENTOR:   { stroke: '#818cf8', strokeWidth: 2 },
  RIVAL:    { stroke: '#fb923c', strokeWidth: 2, strokeDasharray: '5 3' },
  UNKNOWN:  { stroke: '#52525b', strokeWidth: 1.5 },
};

const TAG_LABELS: Partial<Record<RelationshipTag, string>> = {
  ESTRANGED: 'estranged',
  LOVER: 'lover',
  RELUCTANT_DEBTOR: 'reluctant debtor',
  BETRAYER: 'betrayer',
  PROTECTOR: 'protector',
  RIVAL_HEIR: 'rival heir',
  SECRET_CHILD: 'secret child',
  SWORN_ENEMY: 'sworn enemy',
  UNLIKELY_ALLY: 'unlikely ally',
  REDEEMED: 'redeemed',
  FALLEN: 'fallen',
  EXILED: 'exiled',
  DECEASED: 'deceased',
  MISSING: 'missing',
  CORRUPTED: 'corrupted',
  CONFLICTED: 'conflicted',
  DEVOTED: 'devoted',
  MANIPULATIVE: 'manipulative',
  GRIEVING: 'grieving',
  NEUTRAL: 'neutral',
};

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

  const relType = data?.type ?? 'UNKNOWN';
  const style: React.CSSProperties = {
    ...EDGE_STYLES[relType],
    opacity: selected ? 1 : 0.7,
    filter: selected ? 'drop-shadow(0 0 4px currentColor)' : undefined,
  };

  const tagLabel = data?.tag ? TAG_LABELS[data.tag] : null;

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
