"use client";

import { useMemo } from "react";
import { ReactFlow, Background, BackgroundVariant, Controls } from "@xyflow/react";
import Link from "next/link";
import { CharacterNode } from "./CharacterNode";
import { RelationshipEdge } from "./RelationshipEdge";
import { ReportButton } from "./ReportButton";
import { CatalogProvider } from "./CatalogProvider";
import { migrateCanvas } from "@/lib/migrate-canvas";
import { useGenealogyLayout } from "./useGenealogyLayout";
import { UnionNode } from "./UnionNode";
import "@xyflow/react/dist/style.css";
import type { AnyCanvasNode, RelationshipEdgeType, CharacterNodeType, LegacyEdgeType } from "@/store/canvas";

const nodeTypes = { character: CharacterNode, union: UnionNode } as const;
const edgeTypes = { relationship: RelationshipEdge } as const;

type Props = {
  dynastyName: string;
  shareSlug: string;
  nodes: CharacterNodeType[];
  edges: LegacyEdgeType[];
};

export function ShareCanvas({ dynastyName, shareSlug, nodes, edges }: Props) {
  const migrated = useMemo(
    () => migrateCanvas(nodes as never, edges as never),
    [nodes, edges],
  );
  const { nodes: laidOutNodes } = useGenealogyLayout(
    migrated.nodes as AnyCanvasNode[],
    migrated.edges as RelationshipEdgeType[],
  );

  return (
    <CatalogProvider isLoggedIn={false}>
    <div className="relative h-full w-full">
      <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-1.5 text-xs text-zinc-400 backdrop-blur-sm">
          <span>
            👁 Viewing <span className="text-zinc-200">{dynastyName}</span> · Read only
          </span>
          <span className="text-zinc-700">·</span>
          <Link href="/login" className="underline hover:text-zinc-200">
            Sign in to build your own →
          </Link>
          <span className="text-zinc-700">·</span>
          <ReportButton shareSlug={shareSlug} />
        </div>
      </div>

      <ReactFlow
        nodes={laidOutNodes}
        edges={migrated.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-zinc-950"
        proOptions={{ hideAttribution: false }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#3f3f46"
          size={1.5}
          gap={20}
        />
        <Controls
          showInteractive={false}
          className="!bottom-4 !left-auto !right-4 !top-auto"
        />
      </ReactFlow>
    </div>
    </CatalogProvider>
  );
}
