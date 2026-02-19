// Vercel Serverless Function - Stripe API Proxy
import { applyHeaders, verifyAuth, rateLimit, getClientIP, apiLog, tooManyRequests, badRequest } from './_middleware.js';

const STRIPE_BASE = "https://api.stripe.com";
const VALID_ACTIONS = ['customers_list', 'charges_list', 'subscriptions_list', 'balance_transactions', 'invoices_list'];

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = getClientIP(req);
  if (!rateLimit('stripe', ip)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) apiLog('warn', { api: 'stripe', reason: 'unauthed', ip });

  const { action, customer } = req.body || {};
  if (!action) return badRequest(res, "Missing action");
  if (!VALID_ACTIONS.includes(action)) return badRequest(res, "Invalid action");

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: "STRIPE_SECRET_KEY not configured" });

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
      return res.status(stripeRes.status).json({ error: `Stripe API error: ${stripeRes.status}` });
    }

    return res.status(200).json(await stripeRes.json());
  } catch (e) {
    apiLog('error', { api: 'stripe', action }, { error: e.message });
    return res.status(500).json({ error: "Internal proxy error" });
  }
}
