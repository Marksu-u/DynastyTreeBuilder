"use client";

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
  return (
    <div
      role="status"
      className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-accent/30 bg-zinc-900/95 py-2 pl-3 pr-2 shadow-lg backdrop-blur-sm"
    >
      <Sparkles size={14} className="flex-shrink-0 text-accent" aria-hidden="true" />
      <p className="text-xs text-zinc-300">
        This is <span className="font-medium text-zinc-100">{houseName}</span>, an
        example — drag it around, or clear it and build your own.
      </p>
      <button
        onClick={onClear}
        className="flex-shrink-0 cursor-pointer rounded border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
      >
        Start mine
      </button>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
      >
        <X size={13} />
      </button>
    </div>
  );
}
