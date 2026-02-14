// Vercel Serverless Function - GHL API v2 Proxy
// API keys are stored server-side only (Vercel env vars)

const LOCATION_KEY_MAP = {
  "NsV7HI2MbE6qHtRp410y": "GHL_ECO_KEY",
  "BjQ4DxmWrLl3nCNcjmhE": "GHL_LEADX_KEY",
  "2lB0paK192CFU1cLz5eT": "GHL_BCS_KEY",
  "nTgok0v3cxvVLOLXyR11": "GHL_MODERMA_KEY",
};

const GHL_BASE = "https://services.leadconnectorhq.com";

// Basic in-memory rate limiting (per serverless instance)
const rateLimit = {};
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // max requests per window per IP

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

  const { action, locationId, ...params } = req.body || {};

  if (!action || !locationId) {
    return res.status(400).json({ error: "Missing action or locationId" });
  }

  // Validate locationId
  const envVar = LOCATION_KEY_MAP[locationId];
  if (!envVar) {
    return res.status(403).json({ error: "Invalid locationId" });
  }

  const apiKey = process.env[envVar];
  if (!apiKey) {
    return res.status(500).json({ error: `API key not configured for ${envVar}` });
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };

  let url;
  try {
    switch (action) {
      case "contacts":
        url = `${GHL_BASE}/contacts/?locationId=${locationId}&limit=1`;
        break;
      case "pipelines":
        url = `${GHL_BASE}/opportunities/pipelines?locationId=${locationId}`;
        break;
      case "opportunities":
        if (!params.pipeline_id) return res.status(400).json({ error: "Missing pipeline_id" });
        url = `${GHL_BASE}/opportunities/search?location_id=${locationId}&pipeline_id=${params.pipeline_id}&limit=100`;
        break;
      case "contacts_list":
        url = `${GHL_BASE}/contacts/?locationId=${locationId}&limit=100`;
        break;
      case "opportunities_all":
        if (!params.pipeline_id) return res.status(400).json({ error: "Missing pipeline_id" });
        url = `${GHL_BASE}/opportunities/search?location_id=${locationId}&pipeline_id=${params.pipeline_id}&limit=100&status=all`;
        break;
      case "calendars":
        url = `${GHL_BASE}/calendars/?locationId=${locationId}`;
        break;
      case "conversations":
        url = `${GHL_BASE}/conversations/search?locationId=${locationId}&limit=20`;
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    const ghlRes = await fetch(url, { headers });
    if (!ghlRes.ok) {
      const text = await ghlRes.text();
      console.error(`GHL API error ${ghlRes.status}:`, text);
      return res.status(ghlRes.status).json({ error: `GHL API error: ${ghlRes.status}` });
    }

    const data = await ghlRes.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error("GHL proxy error:", e.message);
    return res.status(500).json({ error: "Internal proxy error" });
  }
}
