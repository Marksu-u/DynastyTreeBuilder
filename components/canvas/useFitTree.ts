"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Viewport } from '@xyflow/react';
import { computeFitViewport, type FitNode } from '@/lib/fit-viewport';

/**
 * Controlled-viewport framing for the canvases.
 *
 * React Flow's imperative fitView()/setViewport() are silent no-ops in this app
 * — the toolbar's "Zoom to fit" button and the initial `fitView` prop both did
 * nothing, so any tree wider than the window opened cropped. Driving the
 * viewport as a prop is public API and works, and the framing maths lives in
 * lib/fit-viewport.ts where it is unit-tested.
 *
 * Spread `bind` onto <ReactFlow> and call `fitTree()` from a toolbar button.
 */
export function useFitTree(
  laidOutNodes: FitNode[],
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const hasFittedRef = useRef(false);

  const fitTree = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const next = computeFitViewport(laidOutNodes, { width, height }, {
      padding: 0.08,
      minZoom: 0.15,
      maxZoom: 1.2,
    });
    if (next) setViewport(next);
  }, [laidOutNodes, containerRef]);

  // Held in a ref so the auto-fit effect depends only on the node count. With
  // fitTree itself in the deps, every layout recompute re-ran the effect and its
  // cleanup cancelled the pending frame before it could fire.
  const fitTreeRef = useRef(fitTree);
  useEffect(() => {
    fitTreeRef.current = fitTree;
  }, [fitTree]);

  // Frame once per mount, as soon as there is something to frame — whether the
  // nodes came from a seed, from localStorage, from the server or from import.
  useEffect(() => {
    if (hasFittedRef.current || laidOutNodes.length === 0) return;
    hasFittedRef.current = true;
    // Two frames' grace: one for the container to reach its final size, and one
    // for React Flow's pan/zoom to finish initialising. A fit applied any
    // earlier is overwritten when React Flow echoes its default viewport back
    // through onViewportChange.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => fitTreeRef.current());
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [laidOutNodes.length]);

  return {
    fitTree,
    viewport,
    /** Props to spread onto <ReactFlow> to put its viewport under our control. */
    bind: {
      viewport,
      onViewportChange: setViewport,
      // React Flow's default minZoom of 0.5 makes any house wider than twice
      // the viewport impossible to zoom out far enough to see.
      minZoom: 0.15,
    },
  };
}
