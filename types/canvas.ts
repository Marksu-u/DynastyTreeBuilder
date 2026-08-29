// types/canvas.ts
import type { Node, Edge } from '@xyflow/react';

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
  alias?: string | null;
  flags: CharacterFlag[];
  style: CharacterStyle;
  gender: CharacterGender;
  note?: string | null;
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

// ─── React Flow node / edge shapes ────────────────────────────────────────────
// Declared here, once, and re-exported from store/canvas.ts for the components
// that already import them from there. They used to be redeclared in
// store/canvas.ts, lib/migrate-canvas.ts, lib/import-canvas.ts and two test
// files — and the copies had drifted: the test files' `AnyNode` omitted the
// union variant, so every call they made into migrateCanvas was a type error
// that only `tsc --noEmit` could see, and nothing ran it.

export type CharacterNodeType = Node<CharacterData, 'character'>;
export type UnionNodeType = Node<UnionData, 'union'>;
export type AnyCanvasNode = CharacterNodeType | UnionNodeType;
export type RelationshipEdgeType = Edge<RelationshipData, 'relationship'>;
/** Edge type used at server→client boundaries before migrateCanvas runs. */
export type LegacyEdgeType = Edge<
  Omit<RelationshipData, 'type'> & { type: LegacyRelationshipType },
  'relationship'
>;

/**
 * What migrateCanvas accepts: either DB pair edges straight off the wire, or
 * edges that have already been through it. Naming that union is what let the
 * `as never` casts come off every call site — the casts were there because the
 * parameter claimed to take only the migrated shape.
 */
export type IncomingEdge = RelationshipEdgeType | LegacyEdgeType;
