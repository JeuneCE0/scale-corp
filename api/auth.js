// Vercel Serverless — Supabase Auth Proxy (Hardened)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// --- Brute force protection ---
if (!globalThis._authBrute) globalThis._authBrute = {};
const BRUTE_WINDOW = 15 * 60_000; // 15 minutes
const BRUTE_MAX = 5;

function checkBrute(email) {
  const now = Date.now();
  const b = globalThis._authBrute;
  if (!b[email] || now - b[email].start > BRUTE_WINDOW) {
    b[email] = { start: now, count: 0 };
  }
  return b[email].count < BRUTE_MAX;
}
function recordFail(email) {
  const b = globalThis._authBrute;
  if (!b[email]) b[email] = { start: Date.now(), count: 0 };
  b[email].count++;
}
function resetBrute(email) {
  delete globalThis._authBrute[email];
}

// --- Validation ---
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ACTIONS = ['signup','login','logout','me','update_password','update_user','list_users','delete_user'];

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const { action } = req.query || {};
  if (!action) return res.status(400).json({ error: "Missing action param" });

  // Validate action
  if (!VALID_ACTIONS.includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  console.log(`[${new Date().toISOString()}] AUTH action=${action} ip=${ip}`);

  try {
    // === SIGNUP (admin creates user) ===
    if (action === "signup") {
      if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
      const { email, password, name, role, society_id, company, phone } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: "Missing email or password" });
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Format email invalide" });
      if (password.length < 8) return res.status(400).json({ error: "Mot de passe : 8 caractères minimum" });
      const metadata = { name: name || "", role: role || "porteur", society_id: society_id || "" };
      if (company) metadata.company = company;
      if (phone) metadata.phone = phone;
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: metadata,
        }),
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // === LOGIN ===
    if (action === "login") {
      if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: "Email ou mot de passe incorrect" });
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Email ou mot de passe incorrect" });
      if (password.length < 8) return res.status(400).json({ error: "Email ou mot de passe incorrect" });

      // Brute force check
      if (!checkBrute(email)) {
        console.log(`[${new Date().toISOString()}] AUTH BRUTE_BLOCKED email=${email} ip=${ip}`);
        return res.status(429).json({ error: "Trop de tentatives. Réessayez dans 15 minutes." });
      }

      const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (r.ok) {
        resetBrute(email);
        return res.status(200).json({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user,
        });
      }
      recordFail(email);
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    // === LOGOUT ===
    if (action === "logout") {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      if (token) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
      return res.status(200).json({ ok: true });
    }

    // === ME (get current user from token) ===
    if (action === "me") {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "No token" });
      const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // === UPDATE PASSWORD (admin) ===
    if (action === "update_password") {
      if (req.method !== "PUT" && req.method !== "POST") return res.status(405).json({ error: "PUT/POST required" });
      const { user_id, password } = req.body || {};
      if (!user_id || !password) return res.status(400).json({ error: "Missing user_id or password" });
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
        method: "PUT",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // === UPDATE USER METADATA (admin) ===
    if (action === "update_user") {
      if (req.method !== "PUT" && req.method !== "POST") return res.status(405).json({ error: "PUT/POST required" });
      const { user_id, email, user_metadata, ban_duration } = req.body || {};
      if (!user_id) return res.status(400).json({ error: "Missing user_id" });
      if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: "Format email invalide" });
      const payload = {};
      if (email) payload.email = email;
      if (user_metadata) payload.user_metadata = user_metadata;
      if (ban_duration !== undefined) payload.ban_duration = ban_duration;
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
        method: "PUT",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // === LIST USERS (admin) ===
    if (action === "list_users") {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=100`, {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // === DELETE USER (admin) ===
    if (action === "delete_user") {
      if (req.method !== "DELETE" && req.method !== "POST") return res.status(405).json({ error: "DELETE/POST required" });
      const user_id = req.query.user_id || req.body?.user_id;
      if (!user_id) return res.status(400).json({ error: "Missing user_id" });
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      });
      if (r.status === 200 || r.status === 204) return res.status(200).json({ ok: true });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (e) {
    console.error("Auth proxy error:", e.message);
    return res.status(500).json({ error: "Auth proxy error" });
  }
}
