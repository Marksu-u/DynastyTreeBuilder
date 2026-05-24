export type NameStyle = 'FANTASY' | 'SCI_FI' | 'HISTORICAL' | 'MODERN' | 'HORROR' | 'OTHER';

export type CharacterRole =
  | 'HEIR'
  | 'OPERATIVE'
  | 'INFORMANT'
  | 'SWORN_ENEMY'
  | 'PATRIARCH'
  | 'MATRIARCH'
  | 'ALLY'
  | 'RIVAL'
  | 'ADVISOR'
  | 'UNKNOWN'
  | 'OTHER';

export type CharacterStyle =
  | 'NOBLE'
  | 'WARRIOR'
  | 'MAGE'
  | 'ROGUE'
  | 'CLERIC'
  | 'SCHOLAR'
  | 'COMMONER'
  | 'OTHER';

export type CharacterGender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'UNKNOWN';

export type RelationshipType =
  | 'BLOOD'
  | 'ADOPTED'
  | 'ALLY'
  | 'ENEMY'
  | 'MARRIED'
  | 'BETROTHED'
  | 'MENTOR'
  | 'RIVAL'
  | 'UNKNOWN';

export type RelationshipTag =
  | 'ESTRANGED'
  | 'LOVER'
  | 'RELUCTANT_DEBTOR'
  | 'BETRAYER'
  | 'PROTECTOR'
  | 'RIVAL_HEIR'
  | 'SECRET_CHILD'
  | 'SWORN_ENEMY'
  | 'UNLIKELY_ALLY'
  | 'REDEEMED'
  | 'FALLEN'
  | 'EXILED'
  | 'DECEASED'
  | 'MISSING'
  | 'CORRUPTED'
  | 'CONFLICTED'
  | 'DEVOTED'
  | 'MANIPULATIVE'
  | 'GRIEVING'
  | 'NEUTRAL';

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
}

export interface RelationshipData extends Record<string, unknown> {
  type: RelationshipType;
  tag?: RelationshipTag;
  hook?: string;
  isMutual: boolean;
}
