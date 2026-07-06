import type { CatalogOption } from './types';

/**
 * Default character "Role" suggestions — a single mixed list of archetype/class
 * flavors AND house-position flavors. The field is free-text-with-suggestions:
 * users pick one of these or (when logged in) add their own custom option.
 */
export const CHARACTER_STYLES: CatalogOption[] = [
  // House positions
  { value: 'HEAD_OF_HOUSE', label: 'Head of House' },
  { value: 'HEIR',          label: 'Heir' },
  { value: 'CADET',         label: 'Cadet' },
  { value: 'CONSORT',       label: 'Consort' },
  { value: 'WARD',          label: 'Ward' },
  { value: 'STEWARD',       label: 'Steward' },
  { value: 'RIVAL',         label: 'Rival' },
  // Archetypes / classes
  { value: 'NOBLE',    label: 'Noble' },
  { value: 'WARRIOR',  label: 'Warrior' },
  { value: 'MAGE',     label: 'Mage' },
  { value: 'ROGUE',    label: 'Rogue' },
  { value: 'CLERIC',   label: 'Cleric' },
  { value: 'SCHOLAR',  label: 'Scholar' },
  { value: 'COMMONER', label: 'Commoner' },
  { value: 'OTHER',    label: 'Other' },
];
