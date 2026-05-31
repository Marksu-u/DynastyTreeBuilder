import type { TagTone } from '@/lib/relationship-tags';

export type CatalogKind =
  | 'CHARACTER_ROLE'
  | 'CHARACTER_STYLE'
  | 'RELATIONSHIP_TYPE'
  | 'RELATIONSHIP_TAG';

/** SVG stroke style for relationship-type edges */
export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
}

/**
 * A single selectable option in one of the four open catalogs.
 *
 * Built-in defaults: `color` holds Tailwind badge classes (e.g. 'bg-amber-500/20 text-amber-300').
 * User custom options (Phase D+): `color` holds a hex string '#RRGGBB'.
 */
export interface CatalogOption {
  /** Stored token — e.g. "HEIR", "BLOOD", or user-created "SPYMASTER" */
  value: string;
  /** Human-readable display label */
  label: string;
  /**
   * Visual styling hint.
   * Defaults: Tailwind badge class string.
   * Custom options: hex color string.
   */
  color?: string;
  /** One-sentence description shown in tooltips / picker */
  description?: string;
  /** Grouping hint — 'within' | 'outside' for CHARACTER_ROLE */
  group?: string;
  /** Tone category for RELATIONSHIP_TAG */
  tone?: TagTone;
  /** Two story-hook prompts */
  hooks?: [string, string];
  /** Suggested related tag tokens (CHARACTER_ROLE only) */
  tags?: string[];
  /** SVG stroke style for RELATIONSHIP_TYPE edges */
  edgeStyle?: EdgeStyle;
  /** True when the option was created by the user */
  isCustom?: boolean;
  /** DB primary key — only populated for user-authored custom options */
  id?: string;
}

/** Tailwind badge classes used as fallback for unknown / unresolved tokens */
export const DEFAULT_BADGE = 'bg-zinc-700/50 text-zinc-400 border-zinc-600/40';

/** Edge stroke style used as fallback for unknown relationship types */
export const DEFAULT_EDGE_STYLE: EdgeStyle = {
  stroke: '#52525b',
  strokeWidth: 1.5,
};

/**
 * Convert a SCREAMING_SNAKE_CASE token to a readable label.
 * Used as fallback for tokens not present in the catalog
 * (e.g. deleted custom values, imported trees from other users).
 */
export function fallbackLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
