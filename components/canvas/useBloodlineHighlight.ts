"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildFamilyGraph } from '@/lib/genealogy-layout';
import { bloodlineHighlight, unionHighlight } from '@/lib/descendant-subtree';
import type { BloodlineEntry } from '@/lib/descendant-subtree';
import type { AnyCanvasNode, RelationshipEdgeType } from '@/store/canvas';
import type { HighlightContextValue } from './HighlightContext';

type Source =
  | { kind: 'char'; id: string }
  | { kind: 'union'; id: string };

export interface BloodlineHighlightApi extends HighlightContextValue {
  onNodeMouseEnter: (e: React.MouseEvent, node: AnyCanvasNode) => void;
  onNodeMouseLeave: () => void;
  onNodeClick: (e: React.MouseEvent, node: AnyCanvasNode) => void;
  onEdgeMouseEnter: (e: React.MouseEvent, edge: RelationshipEdgeType) => void;
  onEdgeMouseLeave: () => void;
  onPaneClick: () => void;
  onUnionHover: (unionId: string | null) => void;
}

/** The union a connector belongs to: a PARTNER edge points at it, a child edge
 *  comes from it. */
function unionOfEdge(edge: RelationshipEdgeType): string | null {
  const t = edge.data?.type;
  if (t === 'PARTNER') return edge.target;
  if (t === 'CHILD' || t === 'ADOPTED_CHILD') return edge.source;
  return null;
}

/**
 * Hover/pin highlighting of a lineage spine.
 *
 * Precedence is pinned → hovered card → hovered connector, so moving the
 * pointer across a marriage line on the way to a card never steals the
 * highlight from the card itself.
 */
export function useBloodlineHighlight(
  nodes: AnyCanvasNode[],
  edges: RelationshipEdgeType[],
): BloodlineHighlightApi {
  const [hoveredChar, setHoveredChar] = useState<string | null>(null);
  const [hoveredUnion, setHoveredUnion] = useState<string | null>(null);
  const [pinned, setPinned] = useState<Source | null>(null);

  const graph = useMemo(() => buildFamilyGraph(nodes, edges), [nodes, edges]);

  // A pin whose target has since disappeared (character deleted, or a
  // different dynasty loaded) is ignored rather than cleared in an effect —
  // derived state avoids a cascading re-render, and the stale id is harmless
  // because it can never match again.
  const livePin = useMemo(() => {
    if (!pinned) return null;
    const alive = pinned.kind === 'char'
      ? graph.characterIds.includes(pinned.id)
      : graph.unionById.has(pinned.id);
    return alive ? pinned : null;
  }, [graph, pinned]);

  useEffect(() => {
    if (!livePin) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPinned(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [livePin]);

  // Memoized so the traversal below only reruns when the active target really
  // changes, not on every parent render.
  const source = useMemo<Source | null>(() => (
    livePin
      ?? (hoveredChar ? { kind: 'char', id: hoveredChar } : null)
      ?? (hoveredUnion ? { kind: 'union', id: hoveredUnion } : null)
  ), [livePin, hoveredChar, hoveredUnion]);

  const { chars, edgeMap } = useMemo(() => {
    if (!source) return { chars: null, edgeMap: null };

    const active = source.kind === 'char'
      ? (graph.characterIds.includes(source.id) ? bloodlineHighlight(graph, source.id) : null)
      : unionHighlight(graph, source.id);
    if (!active || active.chars.size === 0) return { chars: null, edgeMap: null };

    const edgeMap = new Map<string, BloodlineEntry>();
    for (const e of edges) {
      const uid = unionOfEdge(e);
      if (!uid) continue;
      const entry = active.unions.get(uid);
      if (entry) edgeMap.set(e.id, entry);
    }
    return { chars: active.chars, edgeMap };
  }, [source, graph, edges]);

  const onNodeMouseEnter = useCallback((_e: React.MouseEvent, node: AnyCanvasNode) => {
    if (node.type === 'character') setHoveredChar(node.id);
  }, []);
  const onNodeMouseLeave = useCallback(() => setHoveredChar(null), []);

  const onNodeClick = useCallback((_e: React.MouseEvent, node: AnyCanvasNode) => {
    if (node.type !== 'character') return;
    setPinned(prev => (prev?.kind === 'char' && prev.id === node.id ? null : { kind: 'char', id: node.id }));
  }, []);

  const onEdgeMouseEnter = useCallback((_e: React.MouseEvent, edge: RelationshipEdgeType) => {
    const uid = unionOfEdge(edge);
    if (uid) setHoveredUnion(uid);
  }, []);
  const onEdgeMouseLeave = useCallback(() => setHoveredUnion(null), []);

  // Connectors call this directly (see HighlightContext.onUnionHover).
  const onUnionHover = useCallback((unionId: string | null) => setHoveredUnion(unionId), []);

  const onPaneClick = useCallback(() => setPinned(null), []);

  return {
    chars,
    edges: edgeMap,
    pinned: livePin !== null,
    onNodeMouseEnter,
    onNodeMouseLeave,
    onNodeClick,
    onEdgeMouseEnter,
    onEdgeMouseLeave,
    onPaneClick,
    onUnionHover,
  };
}
