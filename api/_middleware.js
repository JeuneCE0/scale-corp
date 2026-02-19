// Shared auth middleware for Vercel API routes
// Verifies Supabase JWT, enforces society isolation, CORS, security headers, rate limiting

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// --- Allowed origins for CORS ---
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
const DEFAULT_ORIGINS = ['https://scale-corp.vercel.app', 'https://www.scale-corp.vercel.app'];

function getAllowedOrigins() {
  const origins = new Set([...DEFAULT_ORIGINS, ...ALLOWED_ORIGINS]);
  if (process.env.VERCEL_ENV === 'development' || process.env.NODE_ENV === 'development') {
    origins.add('http://localhost:5173');
    origins.add('http://localhost:3000');
  }
  return origins;
}

/**
 * Set CORS headers - restricted to allowed origins only
 */
export function cors(req, res) {
  const origin = req.headers?.origin || '';
  const allowed = getAllowedOrigins();

  if (origin && allowed.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (!origin && process.env.NODE_ENV === 'development') {
    res.setHeader("Access-Control-Allow-Origin", DEFAULT_ORIGINS[0]);
  }
  // If origin doesn't match, no ACAO header → browser blocks request

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Webhook-Secret");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");
}

/**
 * Set security headers on every response
 */
export function securityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
}

/**
 * Apply both CORS and security headers (convenience)
 */
export function applyHeaders(req, res) {
  cors(req, res);
  securityHeaders(res);
}

// --- Rate Limiting (in-memory with LRU eviction to prevent memory leaks) ---
const RATE_STORES = {};
const MAX_ENTRIES = 10000;

function getRateStore(name) {
  if (!RATE_STORES[name]) {
    RATE_STORES[name] = new Map();
  }
  return RATE_STORES[name];
}

function evictOldEntries(store, windowMs) {
  if (store.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, val] of store) {
    if (now - val.start > windowMs) store.delete(key);
    if (store.size <= MAX_ENTRIES * 0.8) break;
  }
}

/**
 * Rate limit check - returns true if allowed, false if blocked
 */
export function rateLimit(storeName, key, maxRequests = 30, windowMs = 60000) {
  const store = getRateStore(storeName);
  const now = Date.now();
  evictOldEntries(store, windowMs);

  const entry = store.get(key);
  if (!entry || now - entry.start > windowMs) {
    store.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

/**
 * Get client IP from request
 */
export function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || "unknown";
}

/**
 * Structured logger (replaces scattered console.log)
 */
export function apiLog(level, context, extra = {}) {
  if (process.env.NODE_ENV === 'test') return;
  const entry = { ts: new Date().toISOString(), level, ...context, ...extra };
  if (level === 'error') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  // info logs only in development
  else if (process.env.NODE_ENV === 'development') console.log(JSON.stringify(entry));
}

// --- Auth ---

/**
 * Verify Supabase JWT token and return user info
 */
export async function verifyAuth(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return null;

  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!r.ok) return null;
    const user = await r.json();
    if (!user || !user.id) return null;

    const meta = user.user_metadata || {};
    return {
      user,
      userId: user.id,
      societyId: meta.society_id || null,
      role: meta.role || 'porteur',
      isAdmin: meta.role === 'admin',
    };
  } catch {
    return null;
  }
}

/**
 * Check if user has access to a specific society's data
 */
export function canAccessSociety(auth, requestedSocietyId) {
  if (!auth) return false;
  if (auth.isAdmin) return true;
  if (!requestedSocietyId) return true;
  return auth.societyId === requestedSocietyId;
}

// --- Society Mappings (loaded from env with fallbacks) ---

function parseMappingFromEnv(envKey, fallback) {
  try {
    const val = process.env[envKey];
    if (val) return JSON.parse(val);
  } catch { /* use fallback */ }
  return fallback;
}

const SOCIETY_TO_REVOLUT = parseMappingFromEnv('SOCIETY_REVOLUT_MAP', {
  eco: 'eco', leadx: 'leadx', copy: 'bcs', bcs: 'bcs',
});

export function getAllowedRevolutCompany(auth, requestedCompany) {
  if (auth.isAdmin) return requestedCompany;
  const allowed = SOCIETY_TO_REVOLUT[auth.societyId];
  if (!allowed) return null;
  return allowed === requestedCompany ? requestedCompany : null;
}

const SOCIETY_TO_GHL_LOCATION = parseMappingFromEnv('SOCIETY_GHL_MAP', {
  eco: 'NsV7HI2MbE6qHtRp410y',
  leadx: 'BjQ4DxmWrLl3nCNcjmhE',
  copy: '2lB0paK192CFU1cLz5eT',
  bcs: '2lB0paK192CFU1cLz5eT',
});

export function canAccessGHLLocation(auth, locationId) {
  if (auth.isAdmin) return true;
  const allowed = SOCIETY_TO_GHL_LOCATION[auth.societyId];
  return allowed === locationId;
}

// --- Input Validation ---

const DANGEROUS_PATTERN = /[;'"\\]|--|\b(drop|alter|insert|update|delete|exec|union|select)\b/i;

export function sanitizeParam(v) {
  if (typeof v !== 'string') return v;
  if (DANGEROUS_PATTERN.test(v)) return null;
  return v;
}

export function requireOneOf(val, allowed, name) {
  if (!allowed.includes(val)) {
    return { error: `Invalid ${name}` };
  }
  return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateEmail(email) {
  return EMAIL_RE.test(email);
}

// --- Standard Responses ---

export function unauthorized(res, message = "Unauthorized") {
  return res.status(401).json({ error: message });
}

export function forbidden(res, message = "Forbidden: access denied to this resource") {
  return res.status(403).json({ error: message });
}

export function badRequest(res, message = "Bad request") {
  return res.status(400).json({ error: message });
}

export function tooManyRequests(res) {
  return res.status(429).json({ error: "Too many requests. Please try again later." });
}
