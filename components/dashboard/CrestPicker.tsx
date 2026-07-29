"use client";

import { useState } from "react";
import { crestFromSeed, crestToSvg, randomCrestSeed } from "@/lib/crest";

interface Props {
  value: string;
  onChange: (seed: string) => void;
  disabled?: boolean;
}

function svg(seed: string, size: number) {
  return { __html: crestToSvg(crestFromSeed(seed), size) };
}

/**
 * A controlled field, not a self-saving widget: it sits inside a dialog with
 * Save and Cancel, so picking a crest stages the choice and Cancel discards it
 * like every other field here.
 *
 * A single reroll button converges badly — a random walk takes many clicks to
 * land on something the user likes. Six candidates at once gets there in a
 * round or two.
 */
export function CrestPicker({ value, onChange, disabled }: Props) {
  const [candidates, setCandidates] = useState(() =>
    Array.from({ length: 6 }, randomCrestSeed),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          style={{ display: "inline-block", lineHeight: 0 }}
          dangerouslySetInnerHTML={svg(value, 56)}
        />
        <div>
          <p className="text-xs font-medium text-zinc-400">House crest</p>
          <p className="text-xs text-zinc-500">Pick one below, or show another six.</p>
        </div>
      </div>

      <ul className="flex flex-wrap gap-2">
        {candidates.map((candidate) => {
          const selected = candidate === value;
          return (
            <li key={candidate}>
              <button
                type="button"
                onClick={() => onChange(candidate)}
                disabled={disabled}
                aria-label="Use this crest"
                aria-pressed={selected}
                className={`cursor-pointer rounded-lg border p-1.5 transition-colors disabled:opacity-50 ${
                  selected
                    ? "border-accent"
                    : "border-zinc-700 hover:border-zinc-500 focus-visible:border-accent"
                }`}
              >
                <span
                  aria-hidden="true"
                  style={{ display: "inline-block", lineHeight: 0 }}
                  dangerouslySetInnerHTML={svg(candidate, 32)}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => setCandidates(Array.from({ length: 6 }, randomCrestSeed))}
        disabled={disabled}
        className="cursor-pointer self-start rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50"
      >
        Show another six
      </button>
    </div>
  );
}
