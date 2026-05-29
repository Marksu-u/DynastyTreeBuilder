import { LRUCache } from "lru-cache";

const cache = new LRUCache<string, number[]>({ max: 500 });

export function checkRateLimit(
  userId: string,
  limit = 30,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const timestamps = cache.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= limit) return false;
  cache.set(userId, [...recent, now]);
  return true;
}
