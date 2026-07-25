import { describe, it, expect } from "vitest";
import { isDeletionConfirmed } from "./confirm-account";

describe("isDeletionConfirmed", () => {
  it("matches the exact email", () => {
    expect(isDeletionConfirmed("a@b.com", "a@b.com")).toBe(true);
  });

  it("ignores surrounding whitespace and case", () => {
    expect(isDeletionConfirmed("  A@B.CoM  ", "a@b.com")).toBe(true);
  });

  it("rejects a non-matching value", () => {
    expect(isDeletionConfirmed("x@b.com", "a@b.com")).toBe(false);
  });

  it("rejects empty/whitespace input even when the email is empty", () => {
    expect(isDeletionConfirmed("", "")).toBe(false);
    expect(isDeletionConfirmed("   ", "a@b.com")).toBe(false);
  });
});
