export type CatalogKind =
  | 'CHARACTER_STYLE'
  | 'RELATIONSHIP_TYPE';

/** SVG stroke style for relationship-type edges */
export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
}

export interface CatalogOption {
  value: string;
  label: string;
  color?: string;
  description?: string;
  group?: string;
  edgeStyle?: EdgeStyle;
  isCustom?: boolean;
  id?: string;
}

export const DEFAULT_BADGE = 'bg-zinc-700/50 text-zinc-400 border-zinc-600/40';

export const DEFAULT_EDGE_STYLE: EdgeStyle = {
  stroke: '#52525b',
  strokeWidth: 1.5,
};

export function fallbackLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
