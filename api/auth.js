// Vercel Serverless — Supabase Auth Proxy (Hardened)
import { applyHeaders, rateLimit, getClientIP, apiLog, validateEmail, tooManyRequests, badRequest } from './_middleware.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const VALID_ACTIONS = ['signup', 'login', 'logout', 'me', 'update_password', 'list_users', 'delete_user'];

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const { action } = req.query || {};
  if (!action) return badRequest(res, "Missing action param");
  if (!VALID_ACTIONS.includes(action)) return badRequest(res, "Invalid action");

  const ip = getClientIP(req);

  try {
    // === SIGNUP (admin creates user) ===
    if (action === "signup") {
      if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
      const { email, password, name, role, society_id } = req.body || {};
      if (!email || !password) return badRequest(res, "Missing email or password");
      if (!validateEmail(email)) return badRequest(res, "Format email invalide");
      if (password.length < 8) return badRequest(res, "Mot de passe : 8 caractères minimum");
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email, password, email_confirm: true,
          user_metadata: { name: name || "", role: role || "porteur", society_id: society_id || "" },
        }),
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // === LOGIN ===
    if (action === "login") {
      if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
      const { email, password } = req.body || {};
      if (!email || !password) return badRequest(res, "Email ou mot de passe incorrect");
      if (!validateEmail(email)) return badRequest(res, "Email ou mot de passe incorrect");
      if (password.length < 8) return badRequest(res, "Email ou mot de passe incorrect");

      // Brute force: 5 attempts per email per 15 min + 20 per IP per 15 min
      if (!rateLimit('auth_email', email, 5, 15 * 60_000)) {
        apiLog('warn', { api: 'auth', action: 'login', reason: 'brute_blocked', ip });
        return res.status(429).json({ error: "Trop de tentatives. Réessayez dans 15 minutes." });
      }
      if (!rateLimit('auth_ip', ip, 20, 15 * 60_000)) {
        apiLog('warn', { api: 'auth', action: 'login', reason: 'ip_blocked', ip });
        return res.status(429).json({ error: "Trop de tentatives. Réessayez dans 15 minutes." });
      }

      const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (r.ok) {
        return res.status(200).json({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user,
        });
      }
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    // === LOGOUT ===
    if (action === "logout") {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      if (token) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: "POST",
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
      }
      return res.status(200).json({ ok: true });
    }

    // === ME ===
    if (action === "me") {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "No token" });
      const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // === UPDATE PASSWORD (admin) ===
    if (action === "update_password") {
      if (req.method !== "PUT" && req.method !== "POST") return res.status(405).json({ error: "PUT/POST required" });
      const { user_id, password } = req.body || {};
      if (!user_id || !password) return badRequest(res, "Missing user_id or password");
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(user_id)}`, {
        method: "PUT",
        headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // === LIST USERS (admin) ===
    if (action === "list_users") {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=100`, {
        headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // === DELETE USER (admin) ===
    if (action === "delete_user") {
      if (req.method !== "DELETE" && req.method !== "POST") return res.status(405).json({ error: "DELETE/POST required" });
      const user_id = req.query.user_id || req.body?.user_id;
      if (!user_id) return badRequest(res, "Missing user_id");
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(user_id)}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
      });
      if (r.status === 200 || r.status === 204) return res.status(200).json({ ok: true });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    return badRequest(res, `Unknown action: ${action}`);
  } catch (e) {
    apiLog('error', { api: 'auth', action }, { error: e.message });
    return res.status(500).json({ error: "Auth proxy error" });
  }
}
