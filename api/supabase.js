// Vercel Serverless — Supabase REST API Proxy (Hardened)
import { applyHeaders, rateLimit, getClientIP, apiLog, sanitizeParam, tooManyRequests, badRequest } from './_middleware.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const TABLES = ['users', 'societies', 'client_data', 'meta_ads', 'sales_data', 'reports', 'tx_categories', 'user_settings', 'holding'];
const ACTIONS = ['get', 'list', 'upsert', 'delete'];

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const ip = getClientIP(req);
  if (!rateLimit('supabase', ip, 60)) return tooManyRequests(res);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const { action, table, society_id, id, filters } = req.query || {};

  if (!action) return badRequest(res, "Missing action param");
  if (!ACTIONS.includes(action)) return badRequest(res, "Invalid action");

  // Validate table
  const tbl = action === 'upsert' ? req.body?.table : table;
  if (tbl && !TABLES.includes(tbl)) return badRequest(res, "Invalid table");

  // Sanitize query params
  if (society_id && sanitizeParam(society_id) === null) return badRequest(res, "Invalid param");
  if (id && sanitizeParam(id) === null) return badRequest(res, "Invalid param");

  try {
    if (action === "get") {
      if (!tbl) return badRequest(res, "Missing table");
      let url = `${SUPABASE_URL}/rest/v1/${tbl}?select=*`;
      if (society_id) url += `&society_id=eq.${encodeURIComponent(society_id)}`;
      if (filters) {
        try {
          const f = JSON.parse(filters);
          for (const [k, v] of Object.entries(f)) {
            if (sanitizeParam(k) === null || sanitizeParam(String(v)) === null) {
              return badRequest(res, "Invalid filter");
            }
            url += `&${encodeURIComponent(k)}=eq.${encodeURIComponent(v)}`;
          }
        } catch {
          return badRequest(res, "Invalid filters JSON");
        }
      }
      const r = await fetch(url, { headers: sbHeaders() });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    if (action === "list") {
      if (!tbl) return badRequest(res, "Missing table");
      let url = `${SUPABASE_URL}/rest/v1/${tbl}?select=*`;
      if (society_id) url += `&society_id=eq.${encodeURIComponent(society_id)}`;
      const r = await fetch(url, { headers: sbHeaders() });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    if (action === "upsert") {
      if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
      const body = req.body;
      if (!body?.table || !body?.data) return badRequest(res, "Missing table or data");
      if (!TABLES.includes(body.table)) return badRequest(res, "Invalid table");
      const url = `${SUPABASE_URL}/rest/v1/${body.table}`;
      const r = await fetch(url, {
        method: "POST",
        headers: sbHeaders({ Prefer: "return=representation,resolution=merge-duplicates" }),
        body: JSON.stringify(Array.isArray(body.data) ? body.data : [body.data]),
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    if (action === "delete") {
      if (!tbl || !id) return badRequest(res, "Missing table or id");
      const url = `${SUPABASE_URL}/rest/v1/${tbl}?id=eq.${encodeURIComponent(id)}`;
      const r = await fetch(url, {
        method: "DELETE",
        headers: sbHeaders({ Prefer: "return=representation" }),
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    return badRequest(res, `Unknown action: ${action}`);
  } catch (e) {
    apiLog('error', { api: 'supabase', action, table: tbl }, { error: e.message });
    return res.status(500).json({ error: "Proxy error" });
  }
}
