import { describe, it, expect } from "vitest";
import { checkIpRateLimit, checkRateLimit, clientIp } from "./rate-limit";

// The cache is module-level, so every test uses a distinct key rather than
// trying to reset shared state between them.
let n = 0;
const uniqueKey = (prefix: string) => `${prefix}-${process.pid}-${n++}`;

describe("clientIp", () => {
  it("prefers x-real-ip, which the proxy sets and a client cannot forge", () => {
    const headers = new Headers({
      "x-real-ip": "203.0.113.7",
      "x-forwarded-for": "10.0.0.1, 203.0.113.7",
    });
    expect(clientIp(headers)).toBe("203.0.113.7");
  });

  it("falls back to the first x-forwarded-for entry", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" });
    expect(clientIp(headers)).toBe("203.0.113.9");
  });

  it("returns a shared bucket rather than a blank key when no header is present", () => {
    // A blank key would collapse into one bucket anyway; what matters is that it
    // is never falsy, because a falsy key would read as "skip the limit".
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("checkIpRateLimit", () => {
  it("allows up to the limit and refuses the next call", () => {
    const ip = uniqueKey("ip");
    expect([1, 2, 3].map(() => checkIpRateLimit(ip, 3, 60_000))).toEqual([
      true,
      true,
      true,
    ]);
    expect(checkIpRateLimit(ip, 3, 60_000)).toBe(false);
  });

  it("tracks each address separately", () => {
    const a = uniqueKey("ip");
    const b = uniqueKey("ip");
    expect(checkIpRateLimit(a, 1, 60_000)).toBe(true);
    expect(checkIpRateLimit(a, 1, 60_000)).toBe(false);
    expect(checkIpRateLimit(b, 1, 60_000)).toBe(true);
  });

  it("forgets calls that fall outside the window", async () => {
    const ip = uniqueKey("ip");
    expect(checkIpRateLimit(ip, 1, 5)).toBe(true);
    expect(checkIpRateLimit(ip, 1, 5)).toBe(false);
    await new Promise((r) => setTimeout(r, 10));
    expect(checkIpRateLimit(ip, 1, 5)).toBe(true);
  });

  it("shares no keyspace with the signed-in limiter", () => {
    // Same string, two namespaces: a spoofed address must not be able to burn
    // through a real user's allowance.
    const key = uniqueKey("shared");
    expect(checkIpRateLimit(key, 1, 60_000)).toBe(true);
    expect(checkIpRateLimit(key, 1, 60_000)).toBe(false);
    expect(checkRateLimit(key, 1, 60_000)).toBe(true);
  });
});
