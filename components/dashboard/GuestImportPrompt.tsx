"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Import, X } from "lucide-react";
import { useCanvasStore } from "@/store/canvas";
import { useGuestDynastyStore, useGuestHouse } from "@/store/guest-dynasty";
import { importGuestWorld } from "@/app/actions/dynasty";
import { MAX_DYNASTY_NAME } from "@/lib/schemas";

const DISMISS_KEY = "dynasty-guest-import-dismissed";
const GUEST_STORE_KEY = "dynasty-tree-guest";

export function GuestImportPrompt() {
  const t = useTranslations("dashboard.guestImport");
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  /**
   * What the user has typed, or null for "hasn't touched it".
   *
   * The field used to be seeded from the store inside an effect that listed
   * `houseName` as a dependency, so any change to the stored house name threw
   * away what they were typing. A draft that starts as null needs no effect at
   * all: the house name shows through until there is something to show instead.
   */
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  // useGuestHouse rather than the raw store: this reads during render, and the
  // store rehydrates from localStorage before React's hydration pass (see
  // store/guest-dynasty.ts).
  const { name: houseName, setting: houseSetting, crestSeed: houseCrestSeed } =
    useGuestHouse();
  const name = nameDraft ?? houseName;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marking mount and reading the platform localStorage
    setMounted(true);
    if (typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY)) {
      setDismissed(true);
    }
  }, []);

  // Guard against SSR/hydration mismatch and only prompt when there's real work.
  const characterCount = nodes.filter(
    (n) => n.type === "character" && (n.data as { isGhost?: boolean }).isGhost !== true,
  ).length;

  if (!mounted || dismissed || characterCount === 0) return null;

  const handleImport = async () => {
    setImporting(true);
    try {
      const { id } = await importGuestWorld({
        name: name.trim() || houseName,
        setting: houseSetting,
        // '' means arms were never minted; CrestSeedSchema rejects it, and the
        // dynasty falls back to its slug for a crest anyway.
        crestSeed: houseCrestSeed || undefined,
        nodes,
        edges,
      });
      // Guest world now lives in the account — clear the local copy so a refresh
      // or re-login won't re-prompt or double-import.
      useCanvasStore.setState({ nodes: [], edges: [], past: [], future: [], isDirty: false });
      useGuestDynastyStore.getState().resetHouse();
      if (typeof window !== "undefined") {
        localStorage.removeItem(GUEST_STORE_KEY);
        localStorage.removeItem("dynasty-tree-guest-house");
      }
      toast.success(t("success"));
      router.push(`/dashboard/${id}`);
    } catch {
      toast.error(t("error"));
      setImporting(false);
    }
  };

  const handleDismiss = () => {
    if (typeof window !== "undefined") localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="mb-6 rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Import className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
          <div>
            <p className="text-sm font-medium text-zinc-100">{t("heading")}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {t("body", { count: characterCount })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            maxLength={MAX_DYNASTY_NAME}
            value={name}
            onChange={(e) => setNameDraft(e.target.value)}
            disabled={importing}
            aria-label={t("nameLabel")}
            className="w-36 rounded border border-zinc-700 bg-background px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
            placeholder={t("namePlaceholder")}
          />
          <button
            onClick={handleImport}
            disabled={importing}
            className="rounded border border-zinc-600 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
          >
            {importing ? t("importing") : t("import")}
          </button>
          <button
            onClick={handleDismiss}
            disabled={importing}
            aria-label={t("dismiss")}
            className="rounded p-1.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
