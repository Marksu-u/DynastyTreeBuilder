// lib/slug.ts
// Share-path generation for dynasties, and the retry that keeps it unique.
import { Prisma } from "@prisma/client";

/**
 * The public share path for a dynasty. Two properties matter:
 *
 * - It has to be unique, because `slug` is a unique column and a duplicate
 *   surfaces as a raw Prisma error. The suffix used to be `Date.now()`, which
 *   collides whenever two dynasties of the same name are created in the same
 *   millisecond; random bits plus `createWithUniqueSlug` make that a non-event.
 * - It should not carry facts the user did not choose to publish. The old
 *   timestamp put each dynasty's exact creation time in its share URL.
 *
 * Existing slugs are untouched — they are links people may already have sent.
 */
export function makeSlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "dynasty";
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `${base}-${suffix}`;
}

export const SLUG_ATTEMPTS = 3;

/** True for the unique-constraint violation raised by a duplicate slug. */
export function isSlugCollision(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    // `meta.target` names the constraint's columns; anything else is a
    // different uniqueness rule and must not be retried as though it were this.
    String((error.meta as { target?: string[] } | undefined)?.target ?? "").includes("slug")
  );
}

/**
 * Runs a create that mints a slug, retrying with a fresh one if it collides.
 * `attempt` receives the slug rather than closing over it so each retry gets a
 * new one; it may be a whole transaction, in which case the transaction is the
 * retry unit and a collision rolls the rest of it back.
 */
export async function createWithUniqueSlug<T>(
  name: string,
  attempt: (slug: string) => Promise<T>,
): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await attempt(makeSlug(name));
    } catch (error) {
      if (i >= SLUG_ATTEMPTS || !isSlugCollision(error)) throw error;
    }
  }
}
