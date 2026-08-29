"use client";

import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { crestFromSeed, crestToSvg } from "@/lib/crest";
import { useMemo } from "react";

/**
 * The top-centre slot: document identity (design.md §9).
 *
 * The workspace is full-bleed, so there is no header to hold the document's
 * name — this chip floats over the surface instead, carrying the way back, the
 * crest, the name, and a mono stat pair. Every tool in the suite puts the same
 * thing in the same place; only the stats differ.
 */
export function IdentityChip({
  name,
  crestSeed,
  stats,
  backHref,
  backLabel,
  children,
}: {
  name: string;
  crestSeed: string | null;
  /** The mono stat pair, e.g. "18 · 3 gen". Rendered in the mono face because
   *  it is a structural label, not prose (design.md §5). */
  stats?: string;
  /** Omitted for guest mode, which has no dashboard to go back to. */
  backHref?: string;
  backLabel?: string;
  /** Trailing controls that belong to the document itself, e.g. settings. */
  children?: React.ReactNode;
}) {
  const crest = useMemo(
    () => (crestSeed ? crestToSvg(crestFromSeed(crestSeed), 18) : null),
    [crestSeed],
  );

  return (
    <div className="pointer-events-auto absolute left-1/2 top-4 z-20 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2.5 rounded-lg border border-zinc-700 bg-zinc-900/95 py-1.5 pl-2.5 pr-2 shadow-lg backdrop-blur-sm">
      {backHref && (
        <>
          <Link
            href={backHref}
            title={backLabel}
            className="-ml-1 flex items-center rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <ChevronLeft size={14} />
            <span className="sr-only">{backLabel}</span>
          </Link>
          <span aria-hidden="true" className="h-4 w-px bg-zinc-700" />
        </>
      )}

      {crest && (
        <span
          aria-hidden="true"
          style={{ display: "inline-block", lineHeight: 0 }}
          dangerouslySetInnerHTML={{ __html: crest }}
        />
      )}

      <span className="truncate text-sm font-medium text-zinc-100">{name}</span>

      {stats && (
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-zinc-600">
          {stats}
        </span>
      )}

      {children}
    </div>
  );
}
