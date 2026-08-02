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
import { exportDynasty, updateDynastySettings } from "@/app/actions/dynasty";
import { resolveCrestSeed, crestFromSeed, crestToSvg } from "@/lib/crest";
import { toast } from "sonner";
import { triggerJsonDownload } from "@/lib/export";
import "@xyflow/react/dist/style.css";
import type { CharacterNodeType, LegacyEdgeType } from "@/store/canvas";
import type { HouseSettings } from "@/components/dashboard/DynastySettingsDialog";
import type { DynastySetting } from "@/lib/schemas";

type Props = {
  dynastyId: string;
  dynastyName: string;
  dynastySlug: string;
  crestSeed: string | null;
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
  crestSeed,
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

  const savedSeed = resolveCrestSeed({ slug: dynastySlug, crestSeed });

  const handleSaveSettings = useCallback(
    async (next: HouseSettings) => {
      try {
        const result = await updateDynastySettings(dynastyId, {
          name: next.name,
          setting: next.setting,
          isPublic: next.isPublic,
          // Only send it if the user actually picked a different one, so saving
          // other fields never writes a seed where the slug fallback was fine.
          ...(next.crestSeed !== savedSeed ? { crestSeed: next.crestSeed } : {}),
        });
        if (result.error) {
          toast.error(result.error);
          // Keeps the dialog open so a failed save doesn't discard their edits.
          return false;
        }
        toast.success("Settings saved");
        setIsPublic(next.isPublic ?? false);
        return true;
      } catch {
        // A transport-level failure would otherwise reject into the route's
        // error boundary and take the whole canvas down with it.
        toast.error("Couldn't save — check your connection and try again.");
        return false;
      }
    },
    [dynastyId, savedSeed],
  );

  return (
    <ReactFlowProvider>
      {/* CatalogProvider fetches the user's custom catalog options once on mount
          and makes them available to CharacterNode, RelationshipEdge, and all pickers */}
      <CatalogProvider isLoggedIn={true}>
        <div className="flex h-screen flex-col bg-background">
          <header className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-800 px-4">
            <Link
              href="/dashboard"
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              ← Dynasties
            </Link>
            <span className="text-zinc-700">/</span>
            <span
              aria-hidden="true"
              style={{ display: "inline-block", lineHeight: 0 }}
              dangerouslySetInnerHTML={{ __html: crestToSvg(crestFromSeed(savedSeed), 20) }}
            />
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
                initial={{
                  name: dynastyName,
                  // The database stores this as a plain string; the enum is
                  // guaranteed by Prisma's schema, not by TypeScript here.
                  setting: initialSetting as DynastySetting,
                  crestSeed: savedSeed,
                  isPublic: initialIsPublic,
                }}
                showPublic
                onSave={handleSaveSettings}
              />
            </div>
          </header>
          <div ref={canvasRef} className="flex-1 overflow-hidden">
            <DynastyCanvas
              dynastyId={dynastyId}
              dynastyName={dynastyName}
              crestSeed={savedSeed}
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
