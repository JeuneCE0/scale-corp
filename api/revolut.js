// Vercel Serverless Function - Revolut Business API Proxy
// Access tokens are stored server-side only (Vercel env vars)

const COMPANY_TOKEN_MAP = {
  eco: "REVOLUT_ECO_TOKEN",
  leadx: "REVOLUT_LEADX_TOKEN",
  bcs: "REVOLUT_BCS_TOKEN",
};

const REV_BASE = "https://b2b.revolut.com/api/1.0";

// Basic in-memory rate limiting (per serverless instance)
const rateLimit = {};
const RATE_LIMIT_WINDOW = 60_000;
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
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limit
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) return res.status(429).json({ error: "Too many requests" });

  const { action, company } = req.body || {};

  if (!action || !company) {
    return res.status(400).json({ error: "Missing action or company" });
  }

  const envVar = COMPANY_TOKEN_MAP[company];
  if (!envVar) {
    return res.status(403).json({ error: "Invalid company" });
  }

  const token = process.env[envVar];
  if (!token) {
    return res.status(500).json({ error: `Token not configured for ${company}` });
  }

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
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    const revRes = await fetch(url, { headers });
    if (!revRes.ok) {
      const text = await revRes.text();
      console.error(`Revolut API error ${revRes.status}:`, text);
      return res.status(revRes.status).json({ error: `Revolut API error: ${revRes.status}` });
    }

    const data = await revRes.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error("Revolut proxy error:", e.message);
    return res.status(500).json({ error: "Internal proxy error" });
  }
}
