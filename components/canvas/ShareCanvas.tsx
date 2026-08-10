"use client";

import { useMemo, useRef, useCallback } from "react";
import { ReactFlow, Background, BackgroundVariant, useReactFlow } from "@xyflow/react";
import Link from "next/link";
import { CharacterNode } from "./CharacterNode";
import { RelationshipEdge } from "./RelationshipEdge";
import { ReportButton } from "./ReportButton";
import { Download } from "lucide-react";
import { exportCanvasToPng } from "@/lib/export";
import { GenerationBands } from "./GenerationBands";
import { migrateCanvas } from "@/lib/migrate-canvas";
import { useGenealogyLayout } from "./useGenealogyLayout";
import { UnionNode } from "./UnionNode";
import { HighlightContext } from "./HighlightContext";
import { useBloodlineHighlight } from "./useBloodlineHighlight";
import { useFitTree } from "./useFitTree";
import { useCanvasSettled } from "./useCanvasSettled";
import { CanvasLegend } from "./CanvasLegend";
import { ZoomControls } from "./ZoomControls";
import "@xyflow/react/dist/style.css";
import type { AnyCanvasNode, RelationshipEdgeType, CharacterNodeType, LegacyEdgeType } from "@/store/canvas";

const nodeTypes = { character: CharacterNode, union: UnionNode } as const;
const edgeTypes = { relationship: RelationshipEdge } as const;

type Props = {
  dynastyName: string;
  crestSeed: string;
  shareSlug: string;
  nodes: CharacterNodeType[];
  edges: LegacyEdgeType[];
};

export function ShareCanvas({ dynastyName, crestSeed, shareSlug, nodes, edges }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactFlow = useReactFlow();

  const migrated = useMemo(
    () => migrateCanvas(nodes as never, edges as never),
    [nodes, edges],
  );
  const { nodes: laidOutNodes, rows } = useGenealogyLayout(
    migrated.nodes as AnyCanvasNode[],
    migrated.edges as RelationshipEdgeType[],
  );

  const highlight = useBloodlineHighlight(
    migrated.nodes as AnyCanvasNode[],
    migrated.edges as RelationshipEdgeType[],
  );
  const highlightValue = useMemo(
    () => ({ chars: highlight.chars, edges: highlight.edges, pinned: highlight.pinned, onUnionHover: highlight.onUnionHover }),
    [highlight.chars, highlight.edges, highlight.pinned, highlight.onUnionHover],
  );

  const { bind: fitBind } = useFitTree(laidOutNodes, containerRef);
  const settlingClass = useCanvasSettled();

  const handleExport = useCallback(async () => {
    await exportCanvasToPng(reactFlow, containerRef, dynastyName);
  }, [reactFlow, dynastyName]);

  return (
    <div ref={containerRef} className={`relative h-full w-full ${settlingClass}`}>
      <div className="absolute inset-x-0 top-3 z-10 flex justify-center px-3">
        <div className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-1.5 text-xs text-zinc-400 backdrop-blur-sm">
          <span>
            👁 Viewing <span className="text-zinc-200">{dynastyName}</span> · Read only
          </span>
          <span className="text-zinc-700">·</span>
          <Link
            href="/tree"
            className="font-medium text-zinc-200 underline hover:text-white"
          >
            Build your own — no account →
          </Link>
          <span className="text-zinc-700">·</span>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
            title="Export to PNG"
          >
            <Download size={12} className="mr-0.5" />
            <span>Export PNG</span>
          </button>
          <span className="text-zinc-700">·</span>
          <ReportButton shareSlug={shareSlug} />
        </div>
      </div>

      <HighlightContext.Provider value={highlightValue}>
      <ReactFlow
        nodes={laidOutNodes}
        edges={migrated.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeMouseEnter={highlight.onNodeMouseEnter}
        onNodeMouseLeave={highlight.onNodeMouseLeave}
        onNodeClick={highlight.onNodeClick}
        onEdgeMouseEnter={highlight.onEdgeMouseEnter}
        onEdgeMouseLeave={highlight.onEdgeMouseLeave}
        onPaneClick={highlight.onPaneClick}
        colorMode="dark"
        {...fitBind}
        className="bg-background"
        proOptions={{ hideAttribution: false }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="var(--canvas-dot)"
          size={1.2}
          gap={20}
        />
        <GenerationBands rows={rows} nodes={laidOutNodes} houseName={dynastyName} crestSeed={crestSeed} />
      </ReactFlow>
      <div className="canvas-vignette" aria-hidden="true" />

      {/* Same bottom-left stack as the editable canvases (design.md §9). The
          read-only view gets zoom and the legend but no tool actions — there is
          nothing here to edit. */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col items-start gap-2">
        <ZoomControls />
        <CanvasLegend />
      </div>
      </HighlightContext.Provider>
    </div>
  );
}

