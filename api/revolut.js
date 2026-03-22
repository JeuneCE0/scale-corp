// Vercel Serverless Function - Revolut Business API Proxy
import { applyHeaders, verifyAuth, getAllowedRevolutCompany, rateLimit, getClientIP, apiLog, tooManyRequests, badRequest, fetchWithTimeout } from './_middleware.js';
import { refreshToken } from './lib/token-refresh.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const COMPANY_TOKEN_MAP = {
  eco: "REVOLUT_ECO_TOKEN",
  leadx: "REVOLUT_LEADX_TOKEN",
  bcs: "REVOLUT_BCS_TOKEN",
};

// Try to get OAuth token from Supabase api_tokens table
async function getRevolutOAuthToken(company) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/api_tokens?provider=eq.revolut&society_id=eq.${encodeURIComponent(company)}&select=access_token,expires_at,refresh_token`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    if (!rows?.[0]) return null;
    const token = rows[0];
    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return await refreshRevolutToken(token, company);
    }
    return token.access_token;
  } catch { return null; }
}

async function refreshRevolutToken(stored, company) {
  const result = await refreshToken({
    provider: 'revolut',
    stored: { ...stored, society_id: company },
    tokenUrl: 'https://b2b.revolut.com/api/1.0/auth/token',
    clientId: process.env.REVOLUT_OAUTH_CLIENT_ID,
    clientSecret: process.env.REVOLUT_OAUTH_CLIENT_SECRET,
  });
  return result?.access_token || null;
}

const REV_BASE = "https://b2b.revolut.com/api/1.0";
const VALID_ACTIONS = ['accounts', 'transactions'];

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = getClientIP(req);
  if (!rateLimit('revolut', ip)) return tooManyRequests(res);

  const { action, company } = req.body || {};

  // Auth check
  const auth = await verifyAuth(req);
  if (!auth) {
    apiLog('warn', { api: 'revolut', action, reason: 'unauthed', ip });
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (company && !getAllowedRevolutCompany(auth, company)) {
    return res.status(403).json({ error: "Access denied to this company" });
  }

  if (!action || !company) return badRequest(res, "Missing action or company");
  if (!VALID_ACTIONS.includes(action)) return badRequest(res, "Invalid action");

  // Resolve token: env var first, then OAuth token from Supabase
  const envVar = COMPANY_TOKEN_MAP[company];
  let token = envVar ? process.env[envVar] : null;
  if (!token) {
    token = await getRevolutOAuthToken(company);
  }
  if (!token) return res.status(500).json({ error: "Token not configured. Connect via OAuth or set environment variable." });

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let url;
  try {
    switch (action) {
      case "accounts":
        url = `${REV_BASE}/accounts`;
        break;
      case "transactions": {
        const now = new Date();
        const from = req.body.from || new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const count = Math.min(req.body.count || 500, 1000);
        url = `${REV_BASE}/transactions?from=${from}&count=${count}`;
        break;
      }
      default:
        return badRequest(res, `Unknown action: ${action}`);
    }

    const revRes = await fetchWithTimeout(url, { headers });
    if (!revRes.ok) {
      const text = await revRes.text();
      apiLog('error', { api: 'revolut', action }, { status: revRes.status });
      return res.status(revRes.status).json({ error: `Revolut API error: ${revRes.status}` });
    }

    return res.status(200).json(await revRes.json());
  } catch (e) {
    apiLog('error', { api: 'revolut', action }, { error: e.message });
    return res.status(500).json({ error: "Internal proxy error" });
  }
}
