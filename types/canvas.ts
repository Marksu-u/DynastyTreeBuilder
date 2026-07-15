// types/canvas.ts
export type NameStyle = 'FANTASY' | 'SCI_FI' | 'HISTORICAL' | 'MODERN' | 'HORROR' | 'OTHER';

export type CharacterStyle = string;

export type CharacterGender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'UNKNOWN';

export type CharacterFlag = 'FOUNDER' | 'BASTARD' | 'ADOPTED' | 'EXILE' | 'DECEASED';

/** Client-side relationship types. DB canvas stores SPOUSE/PARENT/ADOPTED and migrates on load. */
export type RelationshipType = 'PARTNER' | 'CHILD' | 'ADOPTED_CHILD';

/** DB-only relationship types — used only in server actions and migration. */
export type LegacyRelationshipType = 'PARENT' | 'SPOUSE' | 'ADOPTED';

export interface CharacterData extends Record<string, unknown> {
  name: string;
  alias?: string;
  flags: CharacterFlag[];
  style: CharacterStyle;
  gender: CharacterGender;
  note?: string;
  isReadOnly?: boolean;
  /** Ghost nodes represent unknown parents — rendered differently, not persisted to DB */
  isGhost?: boolean;
}

export interface RelationshipData extends Record<string, unknown> {
  type: RelationshipType;
  hook?: string;
  isMutual: boolean;
}

/** Union nodes carry only their computed rail level for edge staggering. */
export interface UnionData extends Record<string, unknown> {
  railLevel?: number;
  colorIndex?: number;
}
