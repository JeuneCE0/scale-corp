// Vercel Serverless Function - Stripe API Proxy
import { applyHeaders, verifyAuth, rateLimit, getClientIP, apiLog, tooManyRequests, badRequest } from './_middleware.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const STRIPE_BASE = "https://api.stripe.com";
const VALID_ACTIONS = ['customers_list', 'charges_list', 'subscriptions_list', 'balance_transactions', 'invoices_list'];

// Try to get Stripe OAuth token from Supabase api_tokens table
async function getStripeOAuthToken(societyId) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !societyId) return null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/api_tokens?provider=eq.stripe&society_id=eq.${encodeURIComponent(societyId)}&select=access_token`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    return rows?.[0]?.access_token || null;
  } catch { return null; }
}

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const ip = getClientIP(req);
  if (!rateLimit('stripe', ip)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) {
    apiLog('warn', { api: 'stripe', reason: 'unauthed', ip });
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }

  const { action, customer, societyId } = req.body || {};
  if (!action) return badRequest(res, "Missing action");
  if (!VALID_ACTIONS.includes(action)) return badRequest(res, "Invalid action");

  // Resolve key: env var first, then OAuth token
  let key = process.env.STRIPE_SECRET_KEY;
  if (!key && societyId) {
    key = await getStripeOAuthToken(societyId);
  }
  if (!key) return res.status(500).json({ ok: false, error: "Stripe not configured. Connect via OAuth or set STRIPE_SECRET_KEY." });

  const headers = { Authorization: `Bearer ${key}` };

  let url;
  try {
    switch (action) {
      case "customers_list":
        url = `${STRIPE_BASE}/v1/customers?limit=100`;
        break;
      case "charges_list":
        url = `${STRIPE_BASE}/v1/charges?limit=100${customer ? `&customer=${encodeURIComponent(customer)}` : ""}`;
        break;
      case "subscriptions_list":
        url = `${STRIPE_BASE}/v1/subscriptions?limit=100`;
        break;
      case "balance_transactions":
        url = `${STRIPE_BASE}/v1/balance_transactions?limit=50`;
        break;
      case "invoices_list":
        url = `${STRIPE_BASE}/v1/invoices?limit=100`;
        break;
      default:
        return badRequest(res, `Unknown action: ${action}`);
    }

    const stripeRes = await fetch(url, { headers });
    if (!stripeRes.ok) {
      apiLog('error', { api: 'stripe', action }, { status: stripeRes.status });
      return res.status(stripeRes.status).json({ ok: false, error: `Stripe API error: ${stripeRes.status}` });
    }

    return res.status(200).json(await stripeRes.json());
  } catch (e) {
    apiLog('error', { api: 'stripe', action }, { error: e.message });
    return res.status(500).json({ ok: false, error: "Internal proxy error" });
  }
}
