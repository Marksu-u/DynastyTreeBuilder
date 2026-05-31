export type { CatalogKind, CatalogOption, EdgeStyle } from './types';
export { DEFAULT_BADGE, DEFAULT_EDGE_STYLE, fallbackLabel } from './types';
export { CHARACTER_STYLES } from './styles';
export { RELATIONSHIP_TYPES } from './relationship-types';

import type { CatalogKind, CatalogOption } from './types';
import { DEFAULT_BADGE, DEFAULT_EDGE_STYLE, fallbackLabel } from './types';
import { CHARACTER_STYLES } from './styles';
import { RELATIONSHIP_TYPES } from './relationship-types';

export const DEFAULT_CATALOG: Record<CatalogKind, CatalogOption[]> = {
  CHARACTER_STYLE: CHARACTER_STYLES,
  RELATIONSHIP_TYPE: RELATIONSHIP_TYPES,
};

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

  return {
    value,
    label: fallbackLabel(value),
    color: DEFAULT_BADGE,
    edgeStyle: DEFAULT_EDGE_STYLE,
  };
}
