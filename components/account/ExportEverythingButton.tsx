"use client";

import { useState } from "react";
import { toast } from "sonner";
import { exportEverything } from "@/app/actions/dynasty";
import { triggerJsonDownload } from "@/lib/export";

/**
 * The "export everything" affordance on the account screen. Secondary, not
 * accent: the accent is reserved for the tool's signature action, and taking
 * your data out is a right rather than a feature to sell (design.md §3).
 */
export function ExportEverythingButton() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const data = await exportEverything();
      triggerJsonDownload(data, "dynasty-tree-builder-account.json");
      toast.success("Downloaded your account data");
    } catch {
      toast.error("Export failed — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="shrink-0 cursor-pointer rounded-md border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Preparing…" : "Download JSON"}
    </button>
  );
}
