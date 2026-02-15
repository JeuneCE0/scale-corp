// Vercel Serverless — Supabase REST API Proxy (Hardened)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// --- Rate limiting (in-memory, per serverless instance) ---
if (!globalThis._sbRateLimit) globalThis._sbRateLimit = {};
const RATE_WINDOW = 60_000;
const RATE_MAX = 60;

function checkRate(ip) {
  const now = Date.now();
  const rl = globalThis._sbRateLimit;
  if (!rl[ip] || now - rl[ip].start > RATE_WINDOW) {
    rl[ip] = { start: now, count: 1 };
    return true;
  }
  rl[ip].count++;
  return rl[ip].count <= RATE_MAX;
}

// --- Whitelists ---
const TABLES = ['users','societies','client_data','meta_ads','sales_data','reports','tx_categories','user_settings','holding'];
const ACTIONS = ['get','list','upsert','delete'];

// --- Sanitize: reject suspicious PostgREST filter values ---
const DANGEROUS_PATTERN = /[;'"\\]|--|\b(drop|alter|insert|update|delete|exec|union|select)\b/i;
function sanitizeParam(v) {
  if (typeof v !== 'string') return v;
  if (DANGEROUS_PATTERN.test(v)) return null; // blocked
  return v;
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";

  // Rate limit
  if (!checkRate(ip)) {
    console.log(`[${new Date().toISOString()}] RATE_LIMITED ip=${ip}`);
    return res.status(429).json({ error: "Too many requests" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const { action, table, society_id, id, filters } = req.query || {};

  // Validate action
  if (!action) return res.status(400).json({ error: "Missing action param" });
  if (!ACTIONS.includes(action)) {
    console.log(`[${new Date().toISOString()}] BLOCKED invalid action="${action}" ip=${ip}`);
    return res.status(400).json({ error: "Invalid action" });
  }

  // Validate table (for get/list/delete from query, for upsert from body)
  const tbl = action === 'upsert' ? req.body?.table : table;
  if (action !== 'upsert' && tbl && !TABLES.includes(tbl)) {
    console.log(`[${new Date().toISOString()}] BLOCKED invalid table="${tbl}" ip=${ip}`);
    return res.status(400).json({ error: "Invalid table" });
  }
  if (action === 'upsert' && tbl && !TABLES.includes(tbl)) {
    console.log(`[${new Date().toISOString()}] BLOCKED invalid table="${tbl}" ip=${ip}`);
    return res.status(400).json({ error: "Invalid table" });
  }

  // Sanitize query params
  if (society_id && sanitizeParam(society_id) === null) return res.status(400).json({ error: "Invalid param" });
  if (id && sanitizeParam(id) === null) return res.status(400).json({ error: "Invalid param" });

  // Audit log
  console.log(`[${new Date().toISOString()}] action=${action} table=${tbl||'-'} ip=${ip}`);

  try {
    if (action === "get") {
      if (!tbl) return res.status(400).json({ error: "Missing table" });
      let url = `${SUPABASE_URL}/rest/v1/${tbl}?select=*`;
      if (society_id) url += `&society_id=eq.${encodeURIComponent(society_id)}`;
      if (filters) {
        try {
          const f = JSON.parse(filters);
          for (const [k, v] of Object.entries(f)) {
            if (sanitizeParam(k) === null || sanitizeParam(String(v)) === null) {
              return res.status(400).json({ error: "Invalid filter" });
            }
            url += `&${encodeURIComponent(k)}=eq.${encodeURIComponent(v)}`;
          }
        } catch {}
      }
      const r = await fetch(url, { headers: sbHeaders() });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    if (action === "list") {
      if (!tbl) return res.status(400).json({ error: "Missing table" });
      let url = `${SUPABASE_URL}/rest/v1/${tbl}?select=*`;
      if (society_id) url += `&society_id=eq.${encodeURIComponent(society_id)}`;
      const r = await fetch(url, { headers: sbHeaders() });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    if (action === "upsert") {
      if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
      const body = req.body;
      if (!body?.table || !body?.data) return res.status(400).json({ error: "Missing table or data" });
      const url = `${SUPABASE_URL}/rest/v1/${body.table}`;
      const r = await fetch(url, {
        method: "POST",
        headers: sbHeaders({
          Prefer: "return=representation,resolution=merge-duplicates",
        }),
        body: JSON.stringify(Array.isArray(body.data) ? body.data : [body.data]),
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    if (action === "delete") {
      if (!tbl || !id) return res.status(400).json({ error: "Missing table or id" });
      const url = `${SUPABASE_URL}/rest/v1/${tbl}?id=eq.${encodeURIComponent(id)}`;
      const r = await fetch(url, {
        method: "DELETE",
        headers: sbHeaders({ Prefer: "return=representation" }),
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (e) {
    console.error("Supabase proxy error:", e.message);
    return res.status(500).json({ error: "Proxy error" });
  }
}
