"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("account.export");

  async function handleClick() {
    setPending(true);
    try {
      const data = await exportEverything();
      triggerJsonDownload(data, "dynasty-tree-builder-account.json");
      toast.success(t("success"));
    } catch {
      toast.error(t("error"));
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
      {pending ? t("preparing") : t("download")}
    </button>
  );
}
