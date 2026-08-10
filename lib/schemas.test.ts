import { describe, it, expect } from "vitest";
import { CharacterDataSchema, DynastyExportSchema } from "./schemas";

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
