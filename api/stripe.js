// Vercel Serverless Function - Stripe API Proxy

const STRIPE_BASE = "https://api.stripe.com";

const rateLimit = {};
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimit[ip] || now - rateLimit[ip].start > RATE_LIMIT_WINDOW) {
    rateLimit[ip] = { start: now, count: 1 };
    return true;
  }
  rateLimit[ip].count++;
  return rateLimit[ip].count <= RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) return res.status(429).json({ error: "Too many requests" });

  const { action, customer } = req.body || {};
  if (!action) return res.status(400).json({ error: "Missing action" });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: "STRIPE_SECRET_KEY not configured" });

  const headers = {
    Authorization: `Bearer ${key}`,
  };

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
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    const stripeRes = await fetch(url, { headers });
    if (!stripeRes.ok) {
      const text = await stripeRes.text();
      console.error(`Stripe API error ${stripeRes.status}:`, text);
      return res.status(stripeRes.status).json({ error: `Stripe API error: ${stripeRes.status}` });
    }

    const data = await stripeRes.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error("Stripe proxy error:", e.message);
    return res.status(500).json({ error: "Internal proxy error" });
  }
}
