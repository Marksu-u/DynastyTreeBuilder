"use client";

import { useState } from 'react';
import { ChevronDown, HelpCircle, Skull } from 'lucide-react';

/**
 * The key to the card markings.
 *
 * The canvas carries an invented symbolic language — a gold diamond, an amber
 * dot, two different dashed borders — that nobody can guess from looking at it.
 * Collapsed by default so it never competes with the tree, and remembered for
 * the session once opened.
 */
export function CanvasLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-10 max-w-[calc(100vw-2rem)]">
      <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900/95 shadow-lg backdrop-blur-sm">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          <HelpCircle size={13} aria-hidden="true" />
          <span>Legend</span>
          <ChevronDown
            size={12}
            aria-hidden="true"
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <dl className="grid grid-cols-1 gap-x-5 gap-y-1.5 border-t border-zinc-800 px-3 py-2.5 text-[11px] sm:grid-cols-2">
            <Row
              swatch={<span className="text-[10px] leading-none text-accent">◆</span>}
              term="Founder"
              def="Started the line"
            />
            <Row
              swatch={<span className="h-[7px] w-[7px] rounded-full bg-[#EF9F27]" />}
              term="Bastard"
              def="Born outside a marriage"
            />
            <Row
              swatch={<DashSwatch color="#5DCAA5" />}
              term="Adopted"
              def="Brought into the house"
            />
            <Row
              swatch={<DashSwatch color="#D85A30" />}
              term="Exiled"
              def="Cast out, still kin"
            />
            <Row
              swatch={<Skull size={11} className="text-zinc-300" aria-hidden="true" />}
              term="Deceased"
              def="No longer living"
            />
            <Row
              swatch={
                <span className="flex items-center gap-0.5 leading-none">
                  <span className="text-[11px] text-[#4DA3FF]">♂</span>
                  <span className="text-[11px] text-[#FF6FA5]">♀</span>
                  <span className="text-[10px] text-[#C9A8FF]">⚧</span>
                </span>
              }
              term="Gender"
              def="Male, female, non-binary"
            />
          </dl>
        )}
      </div>
    </div>
  );
}

function Row({ swatch, term, def }: { swatch: React.ReactNode; term: string; def: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-4 w-5 flex-shrink-0 items-center justify-center">{swatch}</span>
      <dt className="flex-shrink-0 font-medium text-zinc-200">{term}</dt>
      <dd className="truncate text-zinc-500">{def}</dd>
    </div>
  );
}

/** A short length of the dashed card border, so the key matches what is drawn. */
function DashSwatch({ color }: { color: string }) {
  return (
    <svg width="18" height="10" aria-hidden="true">
      <rect
        x="0.75"
        y="0.75"
        width="16.5"
        height="8.5"
        rx="2"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
    </svg>
  );
}
