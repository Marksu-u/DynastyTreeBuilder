"use client";

import { createContext, useContext } from 'react';
import type { BloodlineEntry, BloodTier } from '@/lib/descendant-subtree';

export interface HighlightContextValue {
  /** null = nothing hovered; otherwise every character on the active lineage
   *  spine, keyed by id, with their tier and generational distance. */
  chars: Map<string, BloodlineEntry> | null;
  /** null = nothing hovered; otherwise the active edge ids mapped to the tier of
   *  the union they belong to, so connectors can be tinted by direction. */
  edges: Map<string, BloodlineEntry> | null;
}

/** Ancestors read cool, descendants read teal, the hovered person holds the
 *  founder gold. Reused from the canvas' existing accent vocabulary
 *  (UNION_HUES + the founder border) so highlighting doesn't introduce a
 *  competing palette. */
export const TIER_COLOR: Record<Exclude<BloodTier, 'spouse'>, string> = {
  root: '#EF9F27',
  ancestor: '#5AA9E6',
  descendant: '#2BBBAD',
};

export const DIM_OPACITY = 0.3;
export const SPOUSE_OPACITY = 0.55;

/** Blood fades gently with generational distance so a long spine reads as near
 *  and far rather than one flat block; the floor keeps the furthest ancestor
 *  clearly legible. */
export function bloodOpacity(depth: number): number {
  return Math.max(0.68, 1 - Math.abs(depth) * 0.07);
}

/** Resolved presentation for one card/edge under the current highlight. */
export function tierStyle(entry: BloodlineEntry | undefined, active: boolean): {
  opacity: number;
  tint: string | null;
} {
  if (!active) return { opacity: 1, tint: null };
  if (!entry) return { opacity: DIM_OPACITY, tint: null };
  if (entry.tier === 'spouse') return { opacity: SPOUSE_OPACITY, tint: null };
  return { opacity: bloodOpacity(entry.depth), tint: TIER_COLOR[entry.tier] };
}

export const HighlightContext = createContext<HighlightContextValue>({
  chars: null,
  edges: null,
});

export function useHighlight() {
  return useContext(HighlightContext);
}
