import { z } from "zod";

export const IdSchema = z.string().min(1, "ID is required");

export const DynastySettingSchema = z.enum([
  "FANTASY", "SCI_FI", "HISTORICAL", "MODERN", "HORROR", "OTHER",
]);

export const NameStyleSchema = z.enum([
  "FANTASY", "SCI_FI", "HISTORICAL", "MODERN", "HORROR", "OTHER",
]);

export const CharacterRoleSchema = z.enum([
  "HEIR", "OPERATIVE", "INFORMANT", "SWORN_ENEMY", "PATRIARCH",
  "MATRIARCH", "ALLY", "RIVAL", "ADVISOR", "UNKNOWN", "OTHER",
]);

export const CharacterStyleSchema = z.enum([
  "NOBLE", "WARRIOR", "MAGE", "ROGUE", "CLERIC", "SCHOLAR", "COMMONER", "OTHER",
]);

export const CharacterGenderSchema = z.enum([
  "MALE", "FEMALE", "NON_BINARY", "UNKNOWN",
]);

export const RelationshipTypeSchema = z.enum([
  "BLOOD", "ADOPTED", "ALLY", "ENEMY", "MARRIED", "BETROTHED", "MENTOR", "RIVAL", "UNKNOWN",
]);

export const RelationshipTagSchema = z.enum([
  "ESTRANGED", "LOVER", "RELUCTANT_DEBTOR", "BETRAYER", "PROTECTOR",
  "RIVAL_HEIR", "SECRET_CHILD", "SWORN_ENEMY", "UNLIKELY_ALLY", "REDEEMED",
  "FALLEN", "EXILED", "DECEASED", "MISSING", "CORRUPTED", "CONFLICTED",
  "DEVOTED", "MANIPULATIVE", "GRIEVING", "NEUTRAL",
]);

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const CharacterDataSchema = z.object({
  name: z.string().min(1, "Name is required"),
  alias: z.string().optional(),
  role: CharacterRoleSchema,
  style: CharacterStyleSchema,
  gender: CharacterGenderSchema,
  note: z.string().optional(),
  isFounder: z.boolean(),
  isLost: z.boolean(),
  generation: z.number().int().min(0),
});

export const RelationshipDataSchema = z.object({
  type: RelationshipTypeSchema,
  tag: RelationshipTagSchema.optional(),
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
  role: CharacterRoleSchema.optional(),
  note: z.string().trim().optional(),
});

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
      role: CharacterRoleSchema,
      style: CharacterStyleSchema,
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
      type: RelationshipTypeSchema,
      tag: RelationshipTagSchema.nullable(),
      hook: z.string().nullable(),
      isMutual: z.boolean(),
    })
  ),
});

export type DynastyExport = z.infer<typeof DynastyExportSchema>;
