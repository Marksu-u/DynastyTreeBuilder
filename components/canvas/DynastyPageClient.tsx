"use client";

import { useCallback, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { DynastyCanvas } from "./DynastyCanvas";
import { DynastySettingsDialog } from "@/components/dashboard/DynastySettingsDialog";
import { AccountChip } from "./AccountChip";
import { ShareButton } from "./ShareButton";
import { updateDynastySettings } from "@/app/actions/dynasty";
import { resolveCrestSeed } from "@/lib/crest";
import { toast } from "sonner";
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

  // JSON export used to live in a header button beside the canvas's own export
  // menu. The toolbar's export dropdown already offers PNG, JSON and import
  // from the top-left slot, so the duplicate went with the header.
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
      {/* Full-bleed: no header, no footer, the surface owns the viewport
          (design.md §9). Everything that used to live in the docked bar now
          floats in one of the fixed slots — identity top-centre, account state
          and the accent action top-right, settings in the top-left toolbar. */}
      <div className="h-screen w-full overflow-hidden bg-background">
        <DynastyCanvas
          dynastyId={dynastyId}
          dynastyName={dynastyName}
          crestSeed={savedSeed}
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          userId={userId}
          onSaveStatusChange={handleSaveStatusChange}
          topRight={
            <>
              <AccountChip mode="account" status={saveStatus} error={saveError} />
              <ShareButton slug={dynastySlug} isPublic={isPublic} />
            </>
          }
          toolbarExtra={
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
          }
        />
      </div>
    </ReactFlowProvider>
  );
}
