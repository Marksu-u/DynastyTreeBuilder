"use client";

import { useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import Link from "next/link";
import { DynastyCanvas } from "./DynastyCanvas";
import { DynastySettingsDialog } from "@/components/dashboard/DynastySettingsDialog";
import { ExportButton } from "./ExportButton";
import "@xyflow/react/dist/style.css";
import type { CharacterNodeType, RelationshipEdgeType } from "@/store/canvas";

type Props = {
  dynastyId: string;
  dynastyName: string;
  initialSetting: string;
  initialIsPublic: boolean;
  initialNodes: CharacterNodeType[];
  initialEdges: RelationshipEdgeType[];
  userId: string;
};

export function DynastyPageClient({
  dynastyId,
  dynastyName,
  initialSetting,
  initialIsPublic,
  initialNodes,
  initialEdges,
  userId,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col bg-zinc-950">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-800 px-4">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            ← Dynasties
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-sm font-medium text-zinc-200">{dynastyName}</span>
          <div className="ml-auto flex items-center gap-2">
            <ExportButton dynastyName={dynastyName} canvasRef={canvasRef} />
            <DynastySettingsDialog
              dynastyId={dynastyId}
              initialName={dynastyName}
              initialSetting={initialSetting}
              initialIsPublic={initialIsPublic}
            />
          </div>
        </header>
        <div ref={canvasRef} className="flex-1 overflow-hidden">
          <DynastyCanvas
            dynastyId={dynastyId}
            dynastyName={dynastyName}
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            userId={userId}
          />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
