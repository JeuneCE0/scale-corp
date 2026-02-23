// HubScale — Rate Limiting Middleware for Vercel Edge
// Applies per-IP request throttling with stricter limits on auth endpoints.

/**
 * In-memory store: IP -> { count: number, resetAt: number }
 * Note: In a multi-instance / serverless environment each isolate has its own
 * map, so this is a best-effort approach.  For production-grade limiting
 * consider an external store (Redis / Upstash).
 * @type {Map<string, { count: number, resetAt: number }>}
 */
const rateLimitMap = new Map();

// --- Configuration -----------------------------------------------------------
const DEFAULT_LIMIT = 60;      // requests per window
const AUTH_LIMIT = 10;         // stricter limit for auth endpoints
const WINDOW_MS = 60 * 1000;   // 1 minute window
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // purge expired entries every 5 min

// Auth-related path prefixes that receive the stricter limit.
const AUTH_PATHS = ['/api/auth'];

// --- Periodic cleanup --------------------------------------------------------
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [ip, entry] of rateLimitMap) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}

// --- Helpers -----------------------------------------------------------------

/**
 * Determine the per-IP request limit based on the request path.
 * @param {string} pathname
 * @returns {number}
 */
function getLimitForPath(pathname) {
  for (const prefix of AUTH_PATHS) {
    if (pathname.startsWith(prefix)) {
      return AUTH_LIMIT;
    }
  }
  return DEFAULT_LIMIT;
}

/**
 * Extract the client IP address from the incoming request.
 * Prefers the standard `x-forwarded-for` header (first entry), then falls
 * back to `request.ip` which Vercel Edge provides.
 * @param {Request & { ip?: string }} request
 * @returns {string}
 */
function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for may contain a comma-separated list; take the first.
    return forwarded.split(',')[0].trim();
  }
  return request.ip || 'unknown';
}

// --- Middleware ---------------------------------------------------------------

/**
 * Vercel Edge Middleware — rate-limits incoming API requests.
 *
 * @param {Request & { ip?: string }} request
 * @returns {Response | undefined} A 429 Response when the limit is exceeded,
 *   or `undefined` to let the request proceed.
 */
export default function middleware(request) {
  // Housekeeping: periodically prune stale entries.
  cleanupExpiredEntries();

  const ip = getClientIp(request);
  const url = new URL(request.url);
  const limit = getLimitForPath(url.pathname);
  const now = Date.now();

  let entry = rateLimitMap.get(ip);

  // First request or window has expired — start a fresh window.
  if (!entry || now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    rateLimitMap.set(ip, entry);
    return undefined; // allow
  }

  entry.count += 1;

  if (entry.count > limit) {
    return new Response(
      JSON.stringify({
        error: 'Trop de requêtes. Réessayez dans quelques instants.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
        },
      },
    );
  }

  return undefined; // allow
}

export const config = { matcher: '/api/:path*' };
