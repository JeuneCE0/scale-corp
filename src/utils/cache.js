// Simple in-memory API response cache with TTL
const cache = new Map();

export function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet(key, data, ttlMs) {
  cache.set(key, { data, ts: Date.now(), ttl: ttlMs });
}

export function cacheInvalidate(key) {
  if (key) cache.delete(key);
  else cache.clear();
}

// Wrapper: fetch with cache
export async function cachedFetch(key, fetchFn, ttlMs = 30000) {
  const cached = cacheGet(key);
  if (cached) return cached;
  const data = await fetchFn();
  if (data) cacheSet(key, data, ttlMs);
  return data;
}
