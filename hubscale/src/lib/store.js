// HubScale — Local State Persistence with versioned cache

const CACHE_VERSION = 1;
const PREFIX = 'hs_';

/** Save to localStorage + fire Supabase sync */
export function store(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ v: CACHE_VERSION, ts: Date.now(), data: value }));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      evictOldest(5);
      try { localStorage.setItem(PREFIX + key, JSON.stringify({ v: CACHE_VERSION, ts: Date.now(), data: value })); } catch {}
    }
  }
}

/** Load from localStorage with version check */
export function load(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.v !== CACHE_VERSION) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

/** Load with TTL check */
export function loadWithTTL(key, maxAgeMs = 86400000) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.v !== CACHE_VERSION || Date.now() - parsed.ts > maxAgeMs) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

/** Remove a key */
export function remove(key) {
  try { localStorage.removeItem(PREFIX + key); } catch {}
}

/** Evict oldest entries when quota is exceeded */
function evictOldest(count = 5) {
  try {
    const entries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) {
        try {
          const p = JSON.parse(localStorage.getItem(k));
          entries.push({ k, ts: p.ts || 0 });
        } catch {
          entries.push({ k, ts: 0 });
        }
      }
    }
    entries.sort((a, b) => a.ts - b.ts).slice(0, count).forEach((e) => localStorage.removeItem(e.k));
  } catch {}
}
