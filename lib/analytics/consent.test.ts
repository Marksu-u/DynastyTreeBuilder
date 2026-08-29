import { describe, it, expect } from "vitest";
import {
  CONSENT_LIFETIME_MS,
  parseConsent,
  serialiseConsent,
} from "./consent";

const NOW = 1_760_000_000_000;

describe("parseConsent", () => {
  it("round-trips both answers", () => {
    expect(parseConsent(serialiseConsent("granted", NOW), NOW)).toBe("granted");
    expect(parseConsent(serialiseConsent("denied", NOW), NOW)).toBe("denied");
  });

  it("reads an absent record as unanswered", () => {
    expect(parseConsent(null, NOW)).toBeNull();
    expect(parseConsent("", NOW)).toBeNull();
  });

  it("reads unparseable or malformed records as unanswered", () => {
    for (const junk of [
      "not json",
      "null",
      "42",
      '"granted"',
      "[]",
      "{}",
      '{"v":1}',
      '{"v":1,"choice":"maybe","at":0}',
      '{"v":1,"choice":"granted"}',
      '{"v":1,"choice":"granted","at":"yesterday"}',
      '{"v":1,"choice":"granted","at":null}',
    ]) {
      expect(parseConsent(junk, NOW), junk).toBeNull();
    }
  });

  it("ignores a record written by an older version", () => {
    const stale = JSON.stringify({ v: 0, choice: "granted", at: NOW });
    expect(parseConsent(stale, NOW)).toBeNull();
  });

  it("keeps a choice for the whole lifetime, then lets it lapse", () => {
    const record = serialiseConsent("granted", NOW);

    expect(parseConsent(record, NOW + CONSENT_LIFETIME_MS)).toBe("granted");
    expect(parseConsent(record, NOW + CONSENT_LIFETIME_MS + 1)).toBeNull();
  });

  it("lapses a refusal too, so the visitor is asked again rather than silently kept out", () => {
    const record = serialiseConsent("denied", NOW);

    expect(parseConsent(record, NOW + 1000)).toBe("denied");
    expect(parseConsent(record, NOW + CONSENT_LIFETIME_MS + 1)).toBeNull();
  });

  it("tolerates a clock that has moved backwards", () => {
    // A device whose clock is corrected backwards would otherwise produce a
    // negative age. That must not read as expiry — it should still be honoured.
    const record = serialiseConsent("granted", NOW);
    expect(parseConsent(record, NOW - 60 * 60 * 1000)).toBe("granted");
  });
});
