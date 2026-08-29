import { describe, it, expect } from "vitest";
import {
  cookieClearDomains,
  expiredCookieStrings,
  parseGaCookieNames,
} from "./ga-cookies";

describe("parseGaCookieNames", () => {
  it("picks out the Google Analytics cookies and leaves the rest alone", () => {
    const jar =
      "sb-abc-auth-token=xyz; _ga=GA1.1.123.456; _ga_PCT4R7XGR9=GS1.1.789; theme=dark";

    expect(parseGaCookieNames(jar)).toEqual(["_ga", "_ga_PCT4R7XGR9"]);
  });

  it("never returns the Supabase session cookie, which is strictly necessary", () => {
    expect(parseGaCookieNames("sb-project-auth-token=xyz")).toEqual([]);
  });

  it("handles an empty jar and stray whitespace", () => {
    expect(parseGaCookieNames("")).toEqual([]);
    expect(parseGaCookieNames("   _ga=1 ;  _ga_X=2  ")).toEqual(["_ga", "_ga_X"]);
  });

  it("does not match a name that merely contains _ga", () => {
    expect(parseGaCookieNames("my_ga=1; ga_thing=2; _gamma=3")).toEqual([]);
  });

  it("de-duplicates a name that appears twice", () => {
    expect(parseGaCookieNames("_ga=1; _ga=2")).toEqual(["_ga"]);
  });
});

describe("cookieClearDomains", () => {
  it("walks up from the host to the registrable domain", () => {
    expect(cookieClearDomains("dynasty.bagofholding.tools")).toEqual([
      null,
      ".dynasty.bagofholding.tools",
      ".bagofholding.tools",
    ]);
  });

  it("stops at the last label pair rather than trying the public suffix", () => {
    expect(cookieClearDomains("bagofholding.tools")).toEqual([null, ".bagofholding.tools"]);
    expect(cookieClearDomains("example.com")).not.toContain(".com");
  });

  it("returns only the host-only case for localhost and IP literals", () => {
    expect(cookieClearDomains("localhost")).toEqual([null]);
    expect(cookieClearDomains("127.0.0.1")).toEqual([null]);
    expect(cookieClearDomains("")).toEqual([null]);
  });
});

describe("expiredCookieStrings", () => {
  it("expires the cookie on the bare host and on every parent domain", () => {
    const strings = expiredCookieStrings("_ga", "dynasty.bagofholding.tools");

    expect(strings).toHaveLength(3);
    expect(strings[0]).toBe("_ga=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/");
    expect(strings[2]).toContain("domain=.bagofholding.tools");
    for (const string of strings) {
      expect(string).toContain("expires=Thu, 01 Jan 1970 00:00:00 GMT");
      expect(string).toContain("path=/");
    }
  });
});
