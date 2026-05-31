import { ROLE_DEFINITIONS } from '@/lib/role-definitions';
import type { CatalogOption } from './types';

/**
 * Tailwind badge class strings for each built-in role token.
 * Extracted from what was previously CharacterNode's local ROLE_COLORS map —
 * now the single source of truth for role badge styling.
 */
const ROLE_BADGE: Record<string, string> = {
  HEIR:        'bg-amber-500/20 text-amber-300 border-amber-500/40',
  PATRIARCH:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  MATRIARCH:   'bg-rose-500/20 text-rose-300 border-rose-500/40',
  OPERATIVE:   'bg-blue-500/20 text-blue-300 border-blue-500/40',
  INFORMANT:   'bg-purple-500/20 text-purple-300 border-purple-500/40',
  SWORN_ENEMY: 'bg-red-500/20 text-red-300 border-red-500/40',
  ALLY:        'bg-green-500/20 text-green-300 border-green-500/40',
  RIVAL:       'bg-orange-500/20 text-orange-300 border-orange-500/40',
  ADVISOR:     'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  UNKNOWN:     'bg-zinc-700/50 text-zinc-400 border-zinc-600/40',
  OTHER:       'bg-zinc-700/50 text-zinc-400 border-zinc-600/40',
};

/** Default character role options, built from ROLE_DEFINITIONS (rich narrative data)
 *  plus the badge color map above. */
export const CHARACTER_ROLES: CatalogOption[] = ROLE_DEFINITIONS.map((def) => ({
  value: def.role,
  label: def.label,
  color: ROLE_BADGE[def.role] ?? 'bg-zinc-700/50 text-zinc-400 border-zinc-600/40',
  description: def.description,
  group: def.group,
  hooks: def.hooks,
  tags: def.tags as string[],
}));
