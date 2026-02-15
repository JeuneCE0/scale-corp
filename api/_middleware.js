// Shared auth middleware for Vercel API routes
// Verifies Supabase JWT and enforces society isolation

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

/**
 * Verify Supabase JWT token and return user info
 * @param {Request} req - The incoming request
 * @returns {Promise<{user: object, societyId: string, role: string} | null>}
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
 * Admins can access all societies. Porteurs can only access their own.
 */
export function canAccessSociety(auth, requestedSocietyId) {
  if (!auth) return false;
  if (auth.isAdmin) return true;
  if (!requestedSocietyId) return true; // No society filter = OK (will be filtered by their own)
  return auth.societyId === requestedSocietyId;
}

/**
 * Map society IDs to Revolut company keys
 */
const SOCIETY_TO_REVOLUT = {
  eco: 'eco',
  leadx: 'leadx',
  copy: 'bcs',
  bcs: 'bcs',
};

export function getAllowedRevolutCompany(auth, requestedCompany) {
  if (auth.isAdmin) return requestedCompany; // Admin can access all
  const allowed = SOCIETY_TO_REVOLUT[auth.societyId];
  if (!allowed) return null;
  return allowed === requestedCompany ? requestedCompany : null;
}

/**
 * Map society IDs to GHL location IDs
 */
const SOCIETY_TO_GHL_LOCATION = {
  eco: 'NsV7HI2MbE6qHtRp410y',
  leadx: 'BjQ4DxmWrLl3nCNcjmhE',
  copy: '2lB0paK192CFU1cLz5eT',
  bcs: '2lB0paK192CFU1cLz5eT',
};

export function canAccessGHLLocation(auth, locationId) {
  if (auth.isAdmin) return true;
  const allowed = SOCIETY_TO_GHL_LOCATION[auth.societyId];
  return allowed === locationId;
}

/**
 * Standard CORS headers
 */
export function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/**
 * Standard unauthorized response
 */
export function unauthorized(res, message = "Unauthorized") {
  return res.status(401).json({ error: message });
}

/**
 * Standard forbidden response
 */
export function forbidden(res, message = "Forbidden: access denied to this resource") {
  return res.status(403).json({ error: message });
}
