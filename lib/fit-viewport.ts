// lib/fit-viewport.ts
// Framing maths for "show me the whole tree".
//
// React Flow's own fitView() is unreliable here: it depends on the internal
// width/height its ResizeObserver records for the pane, and in this app that
// measurement never lands — every fitView() call, including the toolbar's
// "Zoom to fit" button, is silently a no-op or clamps to minZoom. Computing the
// viewport from the laid-out node positions and the container's real size makes
// framing deterministic and unit-testable, and keeps it independent of React
// Flow's measurement lifecycle.
import { CARD_W, CARD_H } from '@/lib/genealogy-layout';

const UNION_SIZE = 16;

export interface FitNode {
  position: { x: number; y: number };
  type?: string;
  measured?: { width?: number | null; height?: number | null };
}

export interface FitViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface FitOptions {
  /** Fraction of the container left as breathing room on each axis. */
  padding?: number;
  minZoom?: number;
  maxZoom?: number;
}

function sizeOf(node: FitNode): { w: number; h: number } {
  const isUnion = node.type === 'union';
  return {
    w: node.measured?.width ?? (isUnion ? UNION_SIZE : CARD_W),
    h: node.measured?.height ?? (isUnion ? UNION_SIZE : CARD_H),
  };
}

/**
 * Returns the viewport that centres every node inside `container`, or null when
 * there is nothing to frame or the container has not been laid out yet.
 */
export function computeFitViewport(
  nodes: FitNode[],
  container: { width: number; height: number },
  options: FitOptions = {},
): FitViewport | null {
  const { padding = 0.15, minZoom = 0.15, maxZoom = 1.5 } = options;

  if (nodes.length === 0) return null;
  if (container.width <= 0 || container.height <= 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes) {
    const { w, h } = sizeOf(node);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;

  const treeW = Math.max(maxX - minX, 1);
  const treeH = Math.max(maxY - minY, 1);

  // Reserve `padding` of the container on both sides of each axis.
  const usableW = container.width * (1 - padding * 2);
  const usableH = container.height * (1 - padding * 2);

  const rawZoom = Math.min(usableW / treeW, usableH / treeH);
  const zoom = Math.min(Math.max(rawZoom, minZoom), maxZoom);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return {
    zoom,
    x: container.width / 2 - centerX * zoom,
    y: container.height / 2 - centerY * zoom,
  };
}
