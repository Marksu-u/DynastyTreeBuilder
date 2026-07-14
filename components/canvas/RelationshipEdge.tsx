"use client";

import { memo } from 'react';
import { BaseEdge, EdgeProps, Edge, useInternalNode } from '@xyflow/react';
import { CARD_W, CARD_H, RAIL_OFFSET, RAIL_STEP } from '@/lib/genealogy-layout';
import type { RelationshipData } from '@/types/canvas';
import { useHighlight } from './HighlightContext';

export type RelationshipEdgeType = Edge<RelationshipData, 'relationship'>;

const EDGE_STYLES: Record<string, React.CSSProperties> = {
  PARTNER:       { stroke: '#888780', strokeWidth: 1.5 },
  CHILD:         { stroke: '#534AB7', strokeWidth: 1.5 },
  ADOPTED_CHILD: { stroke: '#0F6E56', strokeWidth: 1.5, strokeDasharray: '4 3' },
};

const FALLBACK_STYLE: React.CSSProperties = { stroke: '#52525b', strokeWidth: 1.5 };

/**
 * Classic genealogy connectors. The layout guarantees the geometry (partners
 * adjacent on one row with the union point between them; children exactly one
 * row below), so paths are plain orthogonal segments:
 *   PARTNER  — horizontal marriage line from the card edge to the union point
 *   CHILD    — drop from the union point to a sibling rail, then to the child
 */
export const RelationshipEdge = memo(({
  id, source, target, data, selected,
}: EdgeProps<RelationshipEdgeType>) => {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const { activeEdgeIds } = useHighlight();
  // All hooks must run before any early return (Rules of Hooks): useInternalNode
  // returns undefined until a node's internals are measured, so bailing out
  // before useHighlight would change the hook count between renders.
  if (!sourceNode || !targetNode) return null;

  const s = sourceNode.internals.positionAbsolute;
  const t = targetNode.internals.positionAbsolute;
  const relType = data?.type ?? 'CHILD';
  const dimmed = activeEdgeIds !== null && !activeEdgeIds.has(id);
  const emphasized = activeEdgeIds !== null && activeEdgeIds.has(id);

  let path: string;
  if (relType === 'PARTNER') {
    // source = character card, target = union point
    const w = sourceNode.measured?.width ?? CARD_W;
    const h = sourceNode.measured?.height ?? CARD_H;
    // Layout invariant: a couple's union point sits exactly at s.y + CARD_H / 2
    // (lib/genealogy-layout.ts union placement). Compare against the layout
    // constant — NOT measured height — so tall cards and solo unions
    // (placed at s.y + CARD_H) can never flip into the marriage-line branch.
    const marriageY = s.y + CARD_H / 2;
    if (Math.abs(t.y - marriageY) < 1) {
      // partnered union: horizontal marriage line from the nearest card edge
      const fromX = t.x < s.x + w / 2 ? s.x : s.x + w;
      path = `M ${fromX} ${t.y} L ${t.x} ${t.y}`;
    } else {
      // solo-parent union at the card's layout bottom — stub hides behind the card
      path = `M ${s.x + w / 2} ${s.y + h} L ${t.x} ${t.y}`;
    }
  } else {
    // source = union point, target = child card
    const w = targetNode.measured?.width ?? CARD_W;
    // Each of a parent's unions gets its own rail height so child groups never
    // merge into one horizontal bus. Ordinary couples have level 0 (unchanged).
    const level = (sourceNode.data.railLevel as number | undefined) ?? 0;
    const railY = t.y - RAIL_OFFSET - level * RAIL_STEP;
    const cx = t.x + w / 2;
    path = `M ${s.x} ${s.y} L ${s.x} ${railY} L ${cx} ${railY} L ${cx} ${t.y}`;
  }

  const baseStyle = EDGE_STYLES[relType] ?? FALLBACK_STYLE;
  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        ...baseStyle,
        opacity: dimmed ? 0.12 : selected || emphasized ? 1 : 0.8,
        strokeWidth: emphasized ? 2.25 : (baseStyle.strokeWidth as number) ?? 1.5,
        filter: selected ? 'drop-shadow(0 0 4px currentColor)' : undefined,
        transition: 'opacity 120ms',
      }}
      interactionWidth={20}
    />
  );
});

RelationshipEdge.displayName = 'RelationshipEdge';
