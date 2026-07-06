import { describe, it, expect } from "vitest";
import { CharacterDataSchema } from "./schemas";

describe("CharacterDataSchema", () => {
  it("accepts freeform human-readable role text entered via AddCharacterPanel", () => {
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
});
