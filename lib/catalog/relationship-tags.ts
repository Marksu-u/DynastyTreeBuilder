import { RELATIONSHIP_TAGS as TAG_DEFS } from '@/lib/relationship-tags';
import type { CatalogOption } from './types';

/** Default relationship narrative tags, mapped from lib/relationship-tags.ts
 *  (which remains the canonical data source for the reference panel's rich descriptions). */
export const RELATIONSHIP_TAGS: CatalogOption[] = TAG_DEFS.map((def) => ({
  value: def.tag,
  label: def.label,
  description: def.description,
  tone: def.tone,
  hooks: def.hooks,
}));
