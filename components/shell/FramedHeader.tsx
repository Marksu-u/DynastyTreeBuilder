import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The shared header for every *framed* screen — landing, dashboard, account,
 * legal. See docs/design.md §9: framed pages get this header, a max-width
 * column and the shared Footer; full-bleed pages (the workspace) get none of
 * the three and float their chrome over the surface instead.
 *
 * The 57px height is the spec's, not an accident of padding — it is the one
 * number that has to match across five repos for the suite to feel like one
 * product, so it is set explicitly rather than falling out of `py-*`.
 */
export function FramedHeader({
  toolName = "Dynasty Tree Builder",
  href = "/",
  maxWidth = "max-w-5xl",
  children,
}: {
  /** Left slot. Defaults to the tool name; pass a string to override the label. */
  toolName?: ReactNode;
  /** Where the left slot links to. */
  href?: string;
  /** Must match the column width of the page below it, so the two align. */
  maxWidth?: string;
  /** Right slot — nav links, account state, sign out. */
  children?: ReactNode;
}) {
  return (
    <header className="h-[57px] shrink-0 border-b border-zinc-800 px-6">
      <div
        className={`mx-auto flex h-full ${maxWidth} items-center justify-between gap-6`}
      >
        <Link
          href={href}
          className="text-sm font-semibold tracking-tight text-zinc-100 transition-colors hover:text-white"
        >
          {toolName}
        </Link>
        {children ? (
          <div className="flex items-center gap-4 sm:gap-[18px]">{children}</div>
        ) : null}
      </div>
    </header>
  );
}
