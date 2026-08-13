// lib/safe-redirect.ts
// Turns an untrusted `next=` parameter into a path that can only ever point
// back into this app.

export const DEFAULT_REDIRECT = "/dashboard";

/**
 * A same-origin relative path, or `DEFAULT_REDIRECT` if the input is anything
 * else.
 *
 * The auth callback used to concatenate this straight onto the origin. The
 * origin prefix did stop a true cross-origin redirect — `//evil.com` and
 * `/\evil.com` both normalise to a path on our own host — so this is hardening
 * rather than a live hole. It is worth having anyway: the guarantee currently
 * rests on URL-parser behaviour that is easy to lose in a refactor, and even
 * within one origin an attacker-chosen landing path is not something a
 * sign-in link should carry.
 *
 * Rejected: absolute URLs, scheme-relative `//host`, backslash forms that
 * browsers normalise to `//`, control characters (a `\n` can split a header),
 * and anything not starting with `/`.
 */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (!next) return fallback;
  // Control characters, including the newline and tab that browsers strip
  // before parsing — "/\t/evil.com" would otherwise slip through as "//evil.com".
  if (/[\x00-\x1f\x7f]/.test(next)) return fallback;
  if (!next.startsWith("/")) return fallback;
  // Both slash kinds: a special-scheme URL parser treats "\" as "/", so
  // "/\evil.com" reaches the network as "//evil.com".
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
