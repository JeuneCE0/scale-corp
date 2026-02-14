// Vercel Serverless — Supabase REST API Proxy
// No Supabase keys exposed to client

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

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

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const { action, table, society_id, id, filters } = req.query || {};

  if (!action) return res.status(400).json({ error: "Missing action param" });

  try {
    if (action === "get") {
      if (!table) return res.status(400).json({ error: "Missing table" });
      let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
      if (society_id) url += `&society_id=eq.${encodeURIComponent(society_id)}`;
      if (filters) {
        try {
          const f = JSON.parse(filters);
          for (const [k, v] of Object.entries(f)) {
            url += `&${encodeURIComponent(k)}=eq.${encodeURIComponent(v)}`;
          }
        } catch {}
      }
      const r = await fetch(url, { headers: sbHeaders() });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    if (action === "list") {
      if (!table) return res.status(400).json({ error: "Missing table" });
      let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
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
      if (!table || !id) return res.status(400).json({ error: "Missing table or id" });
      const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`;
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
