"use client";

import { useRef, useCallback, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import Link from "next/link";
import { Loader2, Check, CloudOff } from "lucide-react";
import { DynastyCanvas } from "./DynastyCanvas";
import { DynastySettingsDialog } from "@/components/dashboard/DynastySettingsDialog";
import { ExportButton } from "./ExportButton";
import { ShareButton } from "./ShareButton";
import { CatalogProvider } from "./CatalogProvider";
import { exportDynasty } from "@/app/actions/dynasty";
import { triggerJsonDownload } from "@/lib/export";
import "@xyflow/react/dist/style.css";
import type { CharacterNodeType, LegacyEdgeType } from "@/store/canvas";

type Props = {
  dynastyId: string;
  dynastyName: string;
  dynastySlug: string;
  initialSetting: string;
  initialIsPublic: boolean;
  initialNodes: CharacterNodeType[];
  initialEdges: LegacyEdgeType[];
  userId: string;
};

export function DynastyPageClient({
  dynastyId,
  dynastyName,
  dynastySlug,
  initialSetting,
  initialIsPublic,
  initialNodes,
  initialEdges,
  userId,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveStatusChange = useCallback((status: 'saved' | 'saving' | 'error', error?: string) => {
    setSaveStatus(status);
    if (status === 'error') {
      setSaveError(error || 'Server error. Please try again later.');
    } else {
      setSaveError(null);
    }
  }, []);

  const handleExportJson = useCallback(async () => {
    const data = await exportDynasty(dynastyId);
    triggerJsonDownload(data, `${dynastyName}.json`);
  }, [dynastyId, dynastyName]);

  return (
    <ReactFlowProvider>
      {/* CatalogProvider fetches the user's custom catalog options once on mount
          and makes them available to CharacterNode, RelationshipEdge, and all pickers */}
      <CatalogProvider isLoggedIn={true}>
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
            <div className="flex items-center gap-1.5 ml-2">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                  <span className="text-xs text-zinc-500">Saving…</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs text-zinc-500">Saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <CloudOff className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-xs text-red-400 font-medium" title={saveError || undefined}>
                    {saveError || "Error saving"}
                  </span>
                </>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ExportButton
                dynastyName={dynastyName}
                canvasRef={canvasRef}
                onExportJson={handleExportJson}
              />
              <ShareButton slug={dynastySlug} isPublic={isPublic} />
              <DynastySettingsDialog
                dynastyId={dynastyId}
                initialName={dynastyName}
                initialSetting={initialSetting}
                initialIsPublic={initialIsPublic}
                onPublicChange={setIsPublic}
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
              onSaveStatusChange={handleSaveStatusChange}
            />
          </div>
        </div>
      </CatalogProvider>
    </ReactFlowProvider>
  );
}
