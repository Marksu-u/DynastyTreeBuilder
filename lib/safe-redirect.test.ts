import { describe, it, expect } from "vitest";
import { DEFAULT_REDIRECT, safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("keeps an ordinary in-app path", () => {
    expect(safeRedirectPath("/dashboard/abc123")).toBe("/dashboard/abc123");
    expect(safeRedirectPath("/account?tab=data")).toBe("/account?tab=data");
  });

  it("falls back when there is nothing to redirect to", () => {
    expect(safeRedirectPath(null)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("")).toBe(DEFAULT_REDIRECT);
  });

  it("rejects absolute URLs", () => {
    for (const hostile of [
      "https://evil.com",
      "http://evil.com/path",
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
    ]) {
      expect(safeRedirectPath(hostile)).toBe(DEFAULT_REDIRECT);
    }
  });

  it("rejects scheme-relative and backslash forms", () => {
    // A special-scheme URL parser normalises "\" to "/", so both of these reach
    // the network as "//evil.com" — a cross-origin redirect.
    expect(safeRedirectPath("//evil.com")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("/\\evil.com")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("\\\\evil.com")).toBe(DEFAULT_REDIRECT);
  });

  it("rejects control characters that browsers strip before parsing", () => {
    // "/\t/evil.com" becomes "//evil.com" once the tab is removed.
    expect(safeRedirectPath("/\t/evil.com")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("/\n/evil.com")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("/dash\rboard")).toBe(DEFAULT_REDIRECT);
  });

  it("rejects anything not anchored at the app root", () => {
    expect(safeRedirectPath("dashboard")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("../etc")).toBe(DEFAULT_REDIRECT);
  });

  it("honours a caller-supplied fallback", () => {
    expect(safeRedirectPath("https://evil.com", "/login")).toBe("/login");
  });
});
