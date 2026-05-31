import { z } from "zod";

export const IdSchema = z.string().min(1, "ID is required");

// ─── Closed enum schemas (never user-extended) ───────────────────────────────

export const DynastySettingSchema = z.enum([
  "FANTASY", "SCI_FI", "HISTORICAL", "MODERN", "HORROR", "OTHER",
]);

export const NameStyleSchema = z.enum([
  "FANTASY", "SCI_FI", "HISTORICAL", "MODERN", "HORROR", "OTHER",
]);

export const CharacterGenderSchema = z.enum([
  "MALE", "FEMALE", "NON_BINARY", "UNKNOWN",
]);

// ─── Open token schemas (user-extensible catalog values) ─────────────────────

/**
 * Validates a catalog token: SCREAMING_SNAKE_CASE, 1–40 chars.
 * Accepts both default tokens ("HEIR", "BLOOD") and user-created ones ("SPYMASTER").
 */
export const TokenSchema = z
  .string()
  .trim()
  .min(1, "Token is required")
  .max(40, "Token is too long")
  .regex(/^[A-Z0-9_]+$/, "Token must be uppercase letters, digits, or underscores");

// Legacy named exports for compatibility with any code that still references these.
// They now accept any valid token string, not just the built-in set.
export const CharacterRoleSchema = TokenSchema;
export const CharacterStyleSchema = TokenSchema;
export const RelationshipTypeSchema = TokenSchema;
export const RelationshipTagSchema = TokenSchema;

// ─── Domain schemas ───────────────────────────────────────────────────────────

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const CharacterDataSchema = z.object({
  name: z.string().min(1, "Name is required"),
  alias: z.string().optional(),
  role: TokenSchema,
  style: TokenSchema,
  gender: CharacterGenderSchema,
  note: z.string().optional(),
  isFounder: z.boolean(),
  isLost: z.boolean(),
  generation: z.number().int().min(0),
});

export const RelationshipDataSchema = z.object({
  type: TokenSchema,
  tag: TokenSchema.optional(),
  hook: z.string().optional(),
  isMutual: z.boolean(),
});

export const DynastySettingsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  setting: DynastySettingSchema.optional(),
  isPublic: z.boolean().optional(),
});

export const CustomNameInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  style: NameStyleSchema,
  gender: CharacterGenderSchema,
  role: TokenSchema.optional(),
  note: z.string().trim().optional(),
});

// ─── Custom catalog option schema ─────────────────────────────────────────────

export const CustomOptionKindSchema = z.enum([
  "CHARACTER_ROLE",
  "CHARACTER_STYLE",
  "RELATIONSHIP_TYPE",
  "RELATIONSHIP_TAG",
]);

export const CustomOptionInputSchema = z.object({
  kind: CustomOptionKindSchema,
  label: z.string().trim().min(1, "Label is required").max(40, "Label is too long"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value (#RRGGBB)")
    .optional(),
  description: z.string().trim().max(500).optional(),
});

// ─── Export / import schema ───────────────────────────────────────────────────

export const DynastyExportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  dynasty: z.object({
    name: z.string(),
    setting: DynastySettingSchema,
    isPublic: z.boolean(),
  }),
  characters: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      alias: z.string().nullable(),
      role: TokenSchema,
      style: TokenSchema,
      gender: CharacterGenderSchema,
      note: z.string().nullable(),
      isFounder: z.boolean(),
      isLost: z.boolean(),
      generation: z.number().int().min(0),
      posX: z.number(),
      posY: z.number(),
    })
  ),
  relationships: z.array(
    z.object({
      id: z.string(),
      fromId: z.string(),
      toId: z.string(),
      type: TokenSchema,
      tag: TokenSchema.nullable(),
      hook: z.string().nullable(),
      isMutual: z.boolean(),
    })
  ),
});

export type DynastyExport = z.infer<typeof DynastyExportSchema>;
