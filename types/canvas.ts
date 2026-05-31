// CharacterRole, CharacterStyle, RelationshipType, RelationshipTag are now open
// string types to support user-defined catalog values. The canonical default token
// sets live in lib/catalog/ and are validated at runtime via TokenSchema.
// CharacterGender, NameStyle, DynastySetting remain closed enums (not user-extensible).

export type NameStyle = 'FANTASY' | 'SCI_FI' | 'HISTORICAL' | 'MODERN' | 'HORROR' | 'OTHER';

/** Open string — any SCREAMING_SNAKE_CASE token including custom user-defined roles */
export type CharacterRole = string;

/** Open string — any SCREAMING_SNAKE_CASE token including custom user-defined styles */
export type CharacterStyle = string;

export type CharacterGender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'UNKNOWN';

/** Open string — any SCREAMING_SNAKE_CASE token including custom user-defined types */
export type RelationshipType = string;

/** Open string — any SCREAMING_SNAKE_CASE token including custom user-defined tags */
export type RelationshipTag = string;

// Both interfaces include [key: string]: unknown to satisfy @xyflow/react's Node<T> constraint.
// Named property types still resolve correctly for known keys.
export interface CharacterData extends Record<string, unknown> {
  name: string;
  alias?: string;
  role: CharacterRole;
  style: CharacterStyle;
  gender: CharacterGender;
  note?: string;
  isFounder: boolean;
  isLost: boolean;
  generation: number;
  isReadOnly?: boolean;
}

export interface RelationshipData extends Record<string, unknown> {
  type: RelationshipType;
  tag?: RelationshipTag;
  hook?: string;
  isMutual: boolean;
}
