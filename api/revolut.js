// Vercel Serverless Function - Revolut Business API Proxy
import { applyHeaders, verifyAuth, getAllowedRevolutCompany, rateLimit, getClientIP, apiLog, tooManyRequests, badRequest, fetchWithTimeout } from './_middleware.js';

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
  if (!stored.refresh_token) return null;
  const clientId = process.env.REVOLUT_OAUTH_CLIENT_ID;
  const clientSecret = process.env.REVOLUT_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  try {
    const r = await fetchWithTimeout('https://b2b.revolut.com/api/1.0/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: stored.refresh_token, client_id: clientId, client_secret: clientSecret }).toString(),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const payload = {
      id: `revolut_${company}`,
      access_token: data.access_token,
      refresh_token: data.refresh_token || stored.refresh_token,
      expires_at: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    await fetch(`${SUPABASE_URL}/rest/v1/api_tokens`, {
      method: 'POST',
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify([payload]),
    }).catch(() => {});
    return data.access_token;
  } catch { return null; }
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
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
        url = `${REV_BASE}/transactions?from=${from}&count=100`;
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
