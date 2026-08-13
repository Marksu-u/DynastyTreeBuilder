import { LRUCache } from "lru-cache";

// Sized and TTL'd because the keyspace is no longer just our own user ids —
// checkIpRateLimit keys on a client-supplied address, so entries have to expire
// on their own and a flood from many addresses must not be able to evict every
// signed-in user's window. Eviction only ever hands someone a fresh allowance,
// never a smaller one, so the failure mode is a weaker limit rather than a
// wrongly-blocked user.
const cache = new LRUCache<string, number[]>({
  max: 20_000,
  ttl: 60 * 60 * 1000,
});

function check(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = cache.get(key) ?? [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= limit) return false;
  cache.set(key, [...recent, now]);
  return true;
}

export function checkRateLimit(
  userId: string,
  limit = 30,
  windowMs = 60_000
): boolean {
  return check(`user:${userId}`, limit, windowMs);
}

/**
 * Rate limit keyed on client address, for the one action that has no session to
 * key on (reporting a shared tree, which anyone can do). Namespaced apart from
 * the user keyspace so a spoofed address can never consume a real user's window.
 *
 * The address comes from a proxy header, so it is only as trustworthy as the
 * proxy in front of the app — good enough to stop a flood from one machine, not
 * a defence against a distributed one. That is the right ceiling here: the
 * limit is paired with an existence check on the reported slug, so there is no
 * longer an unbounded write for an attacker to reach in the first place.
 */
export function checkIpRateLimit(
  ip: string,
  limit: number,
  windowMs: number
): boolean {
  return check(`ip:${ip}`, limit, windowMs);
}

/**
 * Best-effort client address from the proxy headers Vercel sets.
 * `x-real-ip` first: Vercel sets it to the connecting address, whereas
 * `x-forwarded-for` is a list a client can prepend to, so only its first entry
 * is meaningful. Falls back to a shared bucket rather than to "unlimited" when
 * neither header is present.
 */
export function clientIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return "unknown";
}
