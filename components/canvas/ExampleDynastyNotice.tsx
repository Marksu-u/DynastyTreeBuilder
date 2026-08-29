"use client";

import { useTranslations } from 'next-intl';
import { Sparkles, X } from 'lucide-react';

type Props = {
  houseName: string;
  onClear: () => void;
  onDismiss: () => void;
};

/**
 * Floats over the canvas while the seeded example is still on screen, so the
 * visitor is never confused about whose tree they are looking at and always has
 * a one-click way to get their own blank canvas.
 */
export function ExampleDynastyNotice({ houseName, onClear, onDismiss }: Props) {
  const t = useTranslations("canvas.example");

  return (
    <div
      role="status"
      // top-16, not top-4: the top-centre slot itself belongs to the document
      // identity chip (design.md §9). This is a transient notice *about* that
      // document, so it stacks directly beneath it rather than displacing it.
      className="absolute left-1/2 top-16 z-20 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-accent/30 bg-zinc-900/95 py-2 pl-3 pr-2 shadow-lg backdrop-blur-sm"
    >
      <Sparkles size={14} className="flex-shrink-0 text-accent" aria-hidden="true" />
      <p className="text-xs text-zinc-300">
        {t.rich("body", {
          houseName,
          name: (chunks) => <span className="font-medium text-zinc-100">{chunks}</span>,
        })}
      </p>
      <button
        onClick={onClear}
        className="flex-shrink-0 cursor-pointer rounded border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
      >
        {t("start")}
      </button>
      <button
        onClick={onDismiss}
        aria-label={t("dismiss")}
        className="flex-shrink-0 cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
      >
        <X size={13} />
      </button>
    </div>
  );
}
