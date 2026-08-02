import { z } from "zod";

export const IdSchema = z.string().min(1, "ID is required");

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

// Legacy alias — kept so any remaining import of CharacterStyleSchema still resolves
export const CharacterStyleSchema = TokenSchema;

// ─── Domain schemas ───────────────────────────────────────────────────────────

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const CharacterDataSchema = z.object({
  name: z.string().min(1, "Name is required"),
  alias: z.string().nullable().optional(),
  flags: z.array(CharacterFlagSchema),
  style: z.string().trim().max(60, "Role is too long"),
  gender: CharacterGenderSchema,
  note: z.string().nullable().optional(),
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
  name: z.string().trim().min(1, "Name is required").optional(),
  setting: DynastySettingSchema.optional(),
  isPublic: z.boolean().optional(),
  crestSeed: CrestSeedSchema.optional(),
});

export const CustomNameInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  style: NameStyleSchema,
  gender: CharacterGenderSchema,
  note: z.string().trim().optional(),
});

// ─── Guest → account import schema ────────────────────────────────────────────
// The guest canvas persists React Flow nodes/edges to localStorage (union-node
// model). Extra runtime fields (measured, selected, …) are tolerated via loose
// objects; character/edge data is coerced defensively in the import action.

const GuestNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.string(), z.unknown()).default({}),
});

const GuestEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  data: z.object({ type: z.string() }).loose().optional(),
});

export const GuestSnapshotSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  setting: DynastySettingSchema.optional(),
  crestSeed: CrestSeedSchema.optional(),
  nodes: z.array(GuestNodeSchema),
  edges: z.array(GuestEdgeSchema),
});

export type GuestSnapshot = z.infer<typeof GuestSnapshotSchema>;

// ─── Export / import schema ───────────────────────────────────────────────────

export const DynastyExportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  dynasty: z.object({
    name: z.string(),
    setting: DynastySettingSchema,
    isPublic: z.boolean(),
    // Nullish, not required: files downloaded before crests existed must still
    // parse as version 1 rather than forcing a version bump on every user.
    crestSeed: CrestSeedSchema.nullish(),
  }),
  characters: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      alias: z.string().nullable(),
      flags: z.array(CharacterFlagSchema),
      style: z.string().trim().max(60),
      gender: CharacterGenderSchema,
      note: z.string().nullable(),
      posX: z.number(),
      posY: z.number(),
    })
  ),
  relationships: z.array(
    z.object({
      id: z.string(),
      fromId: z.string(),
      toId: z.string(),
      type: RelationshipTypeSchema,
      hook: z.string().nullable(),
      isMutual: z.boolean(),
    })
  ),
});

export type DynastyExport = z.infer<typeof DynastyExportSchema>;
