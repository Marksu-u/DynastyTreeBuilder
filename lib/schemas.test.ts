import { describe, it, expect } from "vitest";
import {
  CharacterDataSchema,
  DynastyExportSchema,
  DynastyNameSchema,
  GuestSnapshotSchema,
  MAX_CHARACTERS,
  MAX_CHARACTER_NAME,
  MAX_DYNASTY_NAME,
  MAX_FLAGS,
  MAX_NODES,
  MAX_NOTE,
} from "./schemas";

describe("CharacterDataSchema", () => {
  it("accepts freeform human-readable role text entered in the inspector", () => {
    const result = CharacterDataSchema.safeParse({
      name: "Aegon Targaryen",
      alias: undefined,
      flags: [],
      style: "Head of House",
      gender: "UNKNOWN",
      note: undefined,
    });

    expect(result.success).toBe(true);
  });

  it("accepts null for alias and note fields", () => {
    const result = CharacterDataSchema.safeParse({
      name: "Rhaenyra Targaryen",
      alias: null,
      flags: [],
      style: "Heir to the Iron Throne",
      gender: "FEMALE",
      note: null,
    });

    expect(result.success).toBe(true);
  });
});

describe('DynastyExportSchema crest', () => {
  const base = {
    version: 1 as const,
    exportedAt: '2026-08-02T00:00:00.000Z',
    dynasty: { name: 'House Vale', setting: 'FANTASY' as const, isPublic: false },
    characters: [],
    relationships: [],
  };

  it('accepts a file written before crests existed', () => {
    const parsed = DynastyExportSchema.parse(base);
    expect(parsed.dynasty.crestSeed ?? null).toBeNull();
  });

  it('round-trips a crest seed', () => {
    const parsed = DynastyExportSchema.parse({
      ...base,
      dynasty: { ...base.dynasty, crestSeed: 'vale-arms' },
    });
    expect(parsed.dynasty.crestSeed).toBe('vale-arms');
  });

  it('rejects a seed that could not have come from us', () => {
    expect(() =>
      DynastyExportSchema.parse({
        ...base,
        dynasty: { ...base.dynasty, crestSeed: 'not a seed!' },
      }),
    ).toThrow();
  });
});

// Every one of these caps guards a Server Action, which is a plain HTTP
// endpoint — the `maxLength` on the matching input is a courtesy, not a control.
// So each cap is asserted here on the schema itself rather than through the UI.
describe("size limits", () => {
  const character = {
    name: "Aegon",
    alias: null,
    flags: [],
    style: "Heir",
    gender: "UNKNOWN" as const,
    note: null,
  };

  it("rejects a character name past the cap", () => {
    expect(
      CharacterDataSchema.safeParse({
        ...character,
        name: "a".repeat(MAX_CHARACTER_NAME + 1),
      }).success,
    ).toBe(false);
  });

  it("accepts a character name exactly at the cap", () => {
    expect(
      CharacterDataSchema.safeParse({
        ...character,
        name: "a".repeat(MAX_CHARACTER_NAME),
      }).success,
    ).toBe(true);
  });

  it("rejects an oversized note", () => {
    expect(
      CharacterDataSchema.safeParse({
        ...character,
        note: "a".repeat(MAX_NOTE + 1),
      }).success,
    ).toBe(false);
  });

  it("rejects a flags array padded past the size of the enum", () => {
    expect(
      CharacterDataSchema.safeParse({
        ...character,
        flags: Array(MAX_FLAGS + 1).fill("FOUNDER"),
      }).success,
    ).toBe(false);
  });

  it("rejects a dynasty name past the cap, and trims before measuring", () => {
    expect(DynastyNameSchema.safeParse("a".repeat(MAX_DYNASTY_NAME + 1)).success).toBe(false);
    expect(
      DynastyNameSchema.safeParse(`  ${"a".repeat(MAX_DYNASTY_NAME)}  `).success,
    ).toBe(true);
  });

  it("rejects a dynasty name that is only whitespace", () => {
    expect(DynastyNameSchema.safeParse("   ").success).toBe(false);
  });

  it("rejects a guest snapshot with more nodes than the import cap", () => {
    const node = {
      id: "n",
      type: "character",
      position: { x: 0, y: 0 },
      data: {},
    };
    expect(
      GuestSnapshotSchema.safeParse({
        name: "House Flood",
        nodes: Array(MAX_NODES + 1).fill(node),
        edges: [],
      }).success,
    ).toBe(false);
  });

  it("rejects an export file with more characters than the import cap", () => {
    expect(
      DynastyExportSchema.safeParse({
        version: 1,
        exportedAt: "2026-08-13T00:00:00.000Z",
        dynasty: { name: "House Flood", setting: "FANTASY", isPublic: false },
        characters: Array(MAX_CHARACTERS + 1).fill({
          id: "c",
          name: "A",
          alias: null,
          flags: [],
          style: "",
          gender: "UNKNOWN",
          note: null,
          posX: 0,
          posY: 0,
        }),
        relationships: [],
      }).success,
    ).toBe(false);
  });
});
