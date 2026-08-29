import { describe, it, expect } from "vitest";
import { isMeasurementId } from "./gtag";

describe("isMeasurementId", () => {
  it("accepts a well-formed GA4 measurement ID", () => {
    expect(isMeasurementId("G-PCT4R7XGR9")).toBe(true);
    expect(isMeasurementId("G-0123456789")).toBe(true);
  });

  it("rejects an ID that is a character short or long", () => {
    // The exact mistake this guard exists for: a truncated copy-paste loads
    // gtag.js, swallows every hit and reports nothing.
    expect(isMeasurementId("G-PCT4R7XGR")).toBe(false);
    expect(isMeasurementId("G-PCT4R7XGR99")).toBe(false);
  });

  it("rejects other Google property formats and junk", () => {
    for (const value of [
      undefined,
      "",
      "UA-123456-1",
      "GTM-ABCDEF",
      "g-pct4r7xgr9",
      "G_PCT4R7XGR9",
      "G-PCT4R7XGR-",
      " G-PCT4R7XGR9",
      "your-ga-id-here",
    ]) {
      expect(isMeasurementId(value), String(value)).toBe(false);
    }
  });
});
