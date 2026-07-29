"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setCrestSeed } from "@/app/actions/dynasty";
import { crestFromSeed, crestToSvg, randomCrestSeed } from "@/lib/crest";

interface Props {
  dynastyId: string;
  currentSeed: string;
}

function svg(seed: string, size: number) {
  return { __html: crestToSvg(crestFromSeed(seed), size) };
}

/**
 * A single reroll button converges badly — a random walk takes many clicks to
 * land on something the user likes. Six candidates at once gets there in a
 * round or two.
 */
export function CrestPicker({ dynastyId, currentSeed }: Props) {
  const [seed, setSeed] = useState(currentSeed);
  const [candidates, setCandidates] = useState(() =>
    Array.from({ length: 6 }, randomCrestSeed),
  );
  const [isPending, startTransition] = useTransition();

  function adopt(next: string) {
    const previous = seed;
    setSeed(next);
    startTransition(async () => {
      const result = await setCrestSeed(dynastyId, next);
      if (result.error) {
        setSeed(previous);
        toast.error(result.error);
      } else {
        toast.success("Crest updated");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          style={{ display: "inline-block", lineHeight: 0 }}
          dangerouslySetInnerHTML={svg(seed, 56)}
        />
        <div>
          <p className="text-xs font-medium text-zinc-400">House crest</p>
          <p className="text-xs text-zinc-500">Pick one below, or show another six.</p>
        </div>
      </div>

      <ul className="flex flex-wrap gap-2">
        {candidates.map((candidate) => (
          <li key={candidate}>
            <button
              type="button"
              onClick={() => adopt(candidate)}
              disabled={isPending}
              aria-label="Use this crest"
              className="cursor-pointer rounded-lg border border-zinc-700 p-1.5 transition-colors hover:border-accent focus-visible:border-accent focus-visible:outline-none disabled:opacity-50"
            >
              <span
                aria-hidden="true"
                style={{ display: "inline-block", lineHeight: 0 }}
                dangerouslySetInnerHTML={svg(candidate, 32)}
              />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setCandidates(Array.from({ length: 6 }, randomCrestSeed))}
        disabled={isPending}
        className="cursor-pointer self-start rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50"
      >
        Show another six
      </button>
    </div>
  );
}
