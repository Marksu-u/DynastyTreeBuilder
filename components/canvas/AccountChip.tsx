"use client";

import { useTranslations } from "next-intl";
import { Loader2, Check, CloudOff } from "lucide-react";
import { Link } from "@/i18n/navigation";

import type { SaveStatus } from "@/lib/save-status";

export type { SaveStatus };

/**
 * The top-right slot: account state (design.md §9). The one accent action sits
 * beside it, never inside it.
 *
 * Guest and account are the same chip in the same place, because guest mode is
 * the hero rather than a degraded tier — the only difference is what the state
 * says and whether there is a way to sign in. Semantics here are an icon and
 * text, never a fill (design.md §4).
 */
export function AccountChip(
  props:
    | { mode: "guest" }
    | { mode: "account"; status: SaveStatus; error?: string | null },
) {
  const t = useTranslations("canvas.account");

  return (
    <div
      className="workspace-account-chip flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm"
      role={props.mode === "account" && props.status === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {props.mode === "guest" ? (
        <>
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
          />
          <span className="text-xs text-zinc-400">{t("guest")}</span>
          <Link
            href="/login"
            className="text-xs text-zinc-200 underline underline-offset-2 transition-colors hover:text-white"
          >
            {t("signIn")}
          </Link>
        </>
      ) : (
        <SaveState status={props.status} error={props.error} />
      )}
    </div>
  );
}

function SaveState({
  status,
  error,
}: {
  status: SaveStatus;
  error?: string | null;
}) {
  const t = useTranslations("canvas.account");

  if (status === "saving") {
    return (
      <>
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-400" />
        <span className="text-xs text-zinc-500">{t("saving")}</span>
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <CloudOff className="h-3.5 w-3.5 shrink-0 text-destructive" />
        <span
          className="text-xs font-medium text-destructive"
          title={error ?? undefined}
        >
          {error ?? t("errorSaving")}
        </span>
      </>
    );
  }

  return (
    <>
      <Check className="h-3.5 w-3.5 shrink-0 text-success" />
      <span className="text-xs text-zinc-500">{t("saved")}</span>
    </>
  );
}
