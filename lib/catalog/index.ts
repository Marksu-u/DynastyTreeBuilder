// Re-export all public types and helpers
export type { CatalogKind, CatalogOption, EdgeStyle } from './types';
export { DEFAULT_BADGE, DEFAULT_EDGE_STYLE, fallbackLabel } from './types';
export { CHARACTER_ROLES } from './roles';
export { CHARACTER_STYLES } from './styles';
export { RELATIONSHIP_TYPES } from './relationship-types';
export { RELATIONSHIP_TAGS } from './relationship-tags';

import type { CatalogKind, CatalogOption } from './types';
import { DEFAULT_BADGE, DEFAULT_EDGE_STYLE, fallbackLabel } from './types';
import { CHARACTER_ROLES } from './roles';
import { CHARACTER_STYLES } from './styles';
import { RELATIONSHIP_TYPES } from './relationship-types';
import { RELATIONSHIP_TAGS } from './relationship-tags';

// ─── Default catalog ────────────────────────────────────────────────────────

/** The canonical set of built-in options for every catalog kind. */
export const DEFAULT_CATALOG: Record<CatalogKind, CatalogOption[]> = {
  CHARACTER_ROLE: CHARACTER_ROLES,
  CHARACTER_STYLE: CHARACTER_STYLES,
  RELATIONSHIP_TYPE: RELATIONSHIP_TYPES,
  RELATIONSHIP_TAG: RELATIONSHIP_TAGS,
};

// ─── Runtime helpers ────────────────────────────────────────────────────────

/**
 * Merge default catalog options with user-authored custom options.
 * Defaults are always listed first. Custom options whose `value` token
 * matches a default are silently filtered out (collision prevention).
 */
export function mergeCatalog(
  defaults: CatalogOption[],
  customs: CatalogOption[]
): CatalogOption[] {
  const defaultValues = new Set(defaults.map((o) => o.value));
  return [
    ...defaults,
    ...customs.filter((c) => !defaultValues.has(c.value)),
  ];
}

/**
 * Resolve a token string to a CatalogOption.
 *
 * Lookup order:
 * 1. Default catalog for the given kind
 * 2. User's custom options (if provided)
 * 3. Synthetic fallback — title-cased label, neutral styling — so the UI
 *    never crashes on an unknown token (deleted custom, imported tree, etc.)
 */
export function resolveOption(
  kind: CatalogKind,
  value: string,
  customs?: CatalogOption[]
): CatalogOption {
  const defaults = DEFAULT_CATALOG[kind];
  const found =
    defaults.find((o) => o.value === value) ??
    customs?.find((o) => o.value === value);
  if (found) return found;

  // Unknown token — generate a safe fallback so the render never breaks
  return {
    value,
    label: fallbackLabel(value),
    color: DEFAULT_BADGE,
    edgeStyle: DEFAULT_EDGE_STYLE,
  };
}
