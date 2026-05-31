// CharacterStyle and RelationshipType remain open string types.
// CharacterGender and NameStyle remain closed enums.
// CharacterRole and RelationshipTag are retired — replaced by flags and simplified types.

export type NameStyle = 'FANTASY' | 'SCI_FI' | 'HISTORICAL' | 'MODERN' | 'HORROR' | 'OTHER';

/** Open string — any SCREAMING_SNAKE_CASE token including custom user-defined styles */
export type CharacterStyle = string;

export type CharacterGender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'UNKNOWN';

/** Permanent genealogical facts about a character. Multiple can be active simultaneously. */
export type CharacterFlag = 'FOUNDER' | 'BASTARD' | 'ADOPTED' | 'EXILE' | 'DECEASED';

/** Structural relationship types — the only three values accepted. */
export type RelationshipType = 'PARENT' | 'SPOUSE' | 'ADOPTED';

// Both interfaces include [key: string]: unknown to satisfy @xyflow/react's Node<T> constraint.
export interface CharacterData extends Record<string, unknown> {
  name: string;
  alias?: string;
  /** Permanent genealogical facts. Replaces the old single `role` field. */
  flags: CharacterFlag[];
  style: CharacterStyle;
  gender: CharacterGender;
  note?: string;
  generation: number;
  isReadOnly?: boolean;
}

export interface RelationshipData extends Record<string, unknown> {
  type: RelationshipType;
  hook?: string;
  isMutual: boolean;
}
