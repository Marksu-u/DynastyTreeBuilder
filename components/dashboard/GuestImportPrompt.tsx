"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Import, X } from "lucide-react";
import { useCanvasStore } from "@/store/canvas";
import { importGuestWorld } from "@/app/actions/dynasty";

const DISMISS_KEY = "dynasty-guest-import-dismissed";
const GUEST_STORE_KEY = "dynasty-tree-guest";

export function GuestImportPrompt() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [name, setName] = useState("My Dynasty");
  const [importing, setImporting] = useState(false);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  useEffect(() => {
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
        name: name.trim() || "My Dynasty",
        nodes,
        edges,
      });
      // Guest world now lives in the account — clear the local copy so a refresh
      // or re-login won't re-prompt or double-import.
      useCanvasStore.setState({ nodes: [], edges: [], past: [], future: [], isDirty: false });
      if (typeof window !== "undefined") localStorage.removeItem(GUEST_STORE_KEY);
      toast.success("Your guest tree was imported");
      router.push(`/dashboard/${id}`);
    } catch {
      toast.error("Failed to import your guest tree");
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
            <p className="text-sm font-medium text-zinc-100">
              You built a tree as a guest
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Import its {characterCount}{" "}
              {characterCount === 1 ? "character" : "characters"} into a saved
              dynasty on your account.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={importing}
            aria-label="Dynasty name"
            className="w-36 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
            placeholder="My Dynasty"
          />
          <button
            onClick={handleImport}
            disabled={importing}
            className="rounded border border-zinc-600 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
          >
            {importing ? "Importing…" : "Import"}
          </button>
          <button
            onClick={handleDismiss}
            disabled={importing}
            aria-label="Dismiss"
            className="rounded p-1.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
