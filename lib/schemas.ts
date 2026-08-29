import { z } from "zod";

// Ids are cuids today and uuids in optimistic client state, so the shape stays
// loose — but it is bounded, because every id here reaches a WHERE clause.
export const IdSchema = z.string().min(1, "ID is required").max(64, "Invalid ID");

// ─── Size limits ──────────────────────────────────────────────────────────────
// Every string that reaches a column and every array that reaches a loop of
// inserts is capped here. Client inputs carry their own `maxLength`, but a
// Server Action is a plain HTTP endpoint — the cap has to hold on this side to
// mean anything. Values are generous against real use (the seeded example house
// is 9 characters) and cheap against abuse.
export const MAX_DYNASTY_NAME = 100;
export const MAX_CHARACTER_NAME = 100;
export const MAX_ALIAS = 100;
export const MAX_NOTE = 2_000;
export const MAX_HOOK = 500;
/** Flags are a set drawn from a 5-value enum; more than 5 is always junk. */
export const MAX_FLAGS = 5;
export const MAX_CHARACTERS = 2_000;
/** Nodes carry unions as well as characters — one per couple, plus slack. */
export const MAX_NODES = 6_000;
export const MAX_RELATIONSHIPS = 12_000;

export const DynastyNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(MAX_DYNASTY_NAME, "Name is too long");

// ─── Closed enum schemas ──────────────────────────────────────────────────────

export const DynastySettingSchema = z.enum([
  "FANTASY", "SCI_FI", "HISTORICAL", "MODERN", "HORROR", "OTHER",
]);
export type DynastySetting = z.infer<typeof DynastySettingSchema>;

export const NameStyleSchema = z.enum([
  "FANTASY", "SCI_FI", "HISTORICAL", "MODERN", "HORROR", "OTHER",
]);

export const CharacterGenderSchema = z.enum([
  "MALE", "FEMALE", "NON_BINARY", "UNKNOWN",
]);

export const CharacterFlagSchema = z.enum([
  "FOUNDER", "BASTARD", "ADOPTED", "EXILE", "DECEASED",
]);

export const RelationshipTypeSchema = z.enum([
  "PARENT", "SPOUSE", "ADOPTED",
  // Client-side union model types — stored as-is in DB for round-trip
  "PARTNER", "CHILD", "ADOPTED_CHILD",
]);

// ─── Open token schema (user-extensible catalog values) ───────────────────────

export const TokenSchema = z
  .string()
  .trim()
  .min(1, "Token is required")
  .max(40, "Token is too long")
  .regex(/^[A-Z0-9_]+$/, "Token must be uppercase letters, digits, or underscores");

// ─── Domain schemas ───────────────────────────────────────────────────────────

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const CharacterDataSchema = z.object({
  name: z.string().min(1, "Name is required").max(MAX_CHARACTER_NAME, "Name is too long"),
  alias: z.string().max(MAX_ALIAS, "Alias is too long").nullable().optional(),
  flags: z.array(CharacterFlagSchema).max(MAX_FLAGS, "Too many traits"),
  style: z.string().trim().max(60, "Role is too long"),
  gender: CharacterGenderSchema,
  note: z.string().max(MAX_NOTE, "Note is too long").nullable().optional(),
});

// Seeds only ever index into the fixed crest grammar, but they are persisted and
// echoed into image URLs, so keep them to a short opaque token.
// Declared before DynastySettingsSchema, which references it — a `const` used
// above its declaration is in the temporal dead zone and throws at import.
export const CrestSeedSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/i, "Invalid crest");

export const DynastySettingsSchema = z.object({
  name: DynastyNameSchema.optional(),
  setting: DynastySettingSchema.optional(),
  isPublic: z.boolean().optional(),
  crestSeed: CrestSeedSchema.optional(),
});

export const CustomNameInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(MAX_CHARACTER_NAME, "Name is too long"),
  style: NameStyleSchema,
  gender: CharacterGenderSchema,
  note: z.string().trim().max(MAX_NOTE, "Note is too long").optional(),
});

// ─── Guest → account import schema ────────────────────────────────────────────
// The guest canvas persists React Flow nodes/edges to localStorage (union-node
// model). Extra runtime fields (measured, selected, …) are tolerated via loose
// objects; character/edge data is coerced defensively in the import action.

const GuestNodeSchema = z.object({
  id: IdSchema,
  type: z.string().max(40),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.string(), z.unknown()).default({}),
});

const GuestEdgeSchema = z.object({
  id: IdSchema,
  source: IdSchema,
  target: IdSchema,
  data: z.object({ type: z.string().max(40) }).loose().optional(),
});

export const GuestSnapshotSchema = z.object({
  name: DynastyNameSchema,
  setting: DynastySettingSchema.optional(),
  crestSeed: CrestSeedSchema.optional(),
  nodes: z.array(GuestNodeSchema).max(MAX_NODES, "That tree is too large to import"),
  edges: z.array(GuestEdgeSchema).max(MAX_RELATIONSHIPS, "That tree is too large to import"),
});

export type GuestSnapshot = z.infer<typeof GuestSnapshotSchema>;

// ─── Export / import schema ───────────────────────────────────────────────────

export const DynastyExportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  dynasty: z.object({
    name: DynastyNameSchema,
    setting: DynastySettingSchema,
    isPublic: z.boolean(),
    // Nullish, not required: files downloaded before crests existed must still
    // parse as version 1 rather than forcing a version bump on every user.
    crestSeed: CrestSeedSchema.nullish(),
  }),
  // The caps below are the same ones the live editor enforces. A file written
  // before they existed could in principle exceed them; that is the intended
  // trade — an import is a write path into the database, so it answers to the
  // same limits as every other write.
  characters: z
    .array(
      z.object({
        id: IdSchema,
        // No `min` here, unlike the live editor: this schema also has to accept
        // every file we have ever written, and only the cap is load-bearing.
        name: z.string().max(MAX_CHARACTER_NAME),
        alias: z.string().max(MAX_ALIAS).nullable(),
        flags: z.array(CharacterFlagSchema).max(MAX_FLAGS),
        style: z.string().trim().max(60),
        gender: CharacterGenderSchema,
        note: z.string().max(MAX_NOTE).nullable(),
        posX: z.number(),
        posY: z.number(),
      })
    )
    .max(MAX_CHARACTERS, "That file has too many characters"),
  relationships: z
    .array(
      z.object({
        id: IdSchema,
        fromId: IdSchema,
        toId: IdSchema,
        type: RelationshipTypeSchema,
        hook: z.string().max(MAX_HOOK).nullable(),
        isMutual: z.boolean(),
      })
    )
    .max(MAX_RELATIONSHIPS, "That file has too many relationships"),
});

export type DynastyExport = z.infer<typeof DynastyExportSchema>;
