import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { createWithUniqueSlug, isSlugCollision, makeSlug, SLUG_ATTEMPTS } from "./slug";

const collision = () =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target: ["slug"] },
  });

describe("makeSlug", () => {
  it("slugifies the name into the leading segment", () => {
    expect(makeSlug("House Thorne")).toMatch(/^house-thorne-[a-f0-9]{10}$/);
  });

  it("falls back to a stable base when nothing survives slugification", () => {
    expect(makeSlug("!!!")).toMatch(/^dynasty-[a-f0-9]{10}$/);
  });

  it("does not repeat itself for the same name", () => {
    // The suffix used to be Date.now(), so two dynasties named the same in one
    // millisecond produced the same slug — a unique-constraint violation on a
    // column the user never sees.
    const slugs = new Set(Array.from({ length: 200 }, () => makeSlug("House Thorne")));
    expect(slugs.size).toBe(200);
  });

  it("carries no creation timestamp", () => {
    // The old format embedded Date.now() in the public share URL.
    const year = String(new Date().getFullYear());
    expect(makeSlug("House Thorne")).not.toContain(year);
    expect(makeSlug("House Thorne")).not.toMatch(/-\d{13}$/);
  });
});

describe("isSlugCollision", () => {
  it("recognises a unique-constraint violation on slug", () => {
    expect(isSlugCollision(collision())).toBe(true);
  });

  it("ignores a unique-constraint violation on some other column", () => {
    const other = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
      meta: { target: ["email"] },
    });
    expect(isSlugCollision(other)).toBe(false);
  });

  it("ignores unrelated errors", () => {
    expect(isSlugCollision(new Error("connection reset"))).toBe(false);
    expect(isSlugCollision(undefined)).toBe(false);
  });
});

describe("createWithUniqueSlug", () => {
  it("returns the first attempt's result when nothing collides", async () => {
    const seen: string[] = [];
    const result = await createWithUniqueSlug("House Thorne", async (slug) => {
      seen.push(slug);
      return slug;
    });
    expect(seen).toHaveLength(1);
    expect(result).toBe(seen[0]);
  });

  it("retries with a different slug after a collision", async () => {
    const seen: string[] = [];
    const result = await createWithUniqueSlug("House Thorne", async (slug) => {
      seen.push(slug);
      if (seen.length === 1) throw collision();
      return slug;
    });
    expect(seen).toHaveLength(2);
    expect(seen[0]).not.toBe(seen[1]);
    expect(result).toBe(seen[1]);
  });

  it("gives up after a bounded number of attempts rather than looping", async () => {
    let calls = 0;
    await expect(
      createWithUniqueSlug("House Thorne", async () => {
        calls++;
        throw collision();
      }),
    ).rejects.toThrow();
    expect(calls).toBe(SLUG_ATTEMPTS);
  });

  it("does not retry an error that is not a slug collision", async () => {
    let calls = 0;
    await expect(
      createWithUniqueSlug("House Thorne", async () => {
        calls++;
        throw new Error("connection reset");
      }),
    ).rejects.toThrow("connection reset");
    expect(calls).toBe(1);
  });
});
