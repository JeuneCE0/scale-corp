// Vercel Serverless — JSON KV Store (file-based for /tmp)
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { applyHeaders, verifyAuth, rateLimit, getClientIP, apiLog, tooManyRequests, badRequest } from './_middleware.js';

const STORE_DIR = '/tmp/scale-store';

async function ensureDir() {
  try { await mkdir(STORE_DIR, { recursive: true }); } catch { /* dir exists */ }
}

function sanitizeKey(k) {
  return k.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
}

async function getData(key) {
  try {
    const raw = await readFile(join(STORE_DIR, sanitizeKey(key) + '.json'), 'utf8');
    return JSON.parse(raw);
  } catch { return null; }
}

async function setData(key, value) {
  await ensureDir();
  await writeFile(join(STORE_DIR, sanitizeKey(key) + '.json'), JSON.stringify(value), 'utf8');
}

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const ip = getClientIP(req);
  if (!rateLimit('store', ip, 60)) return tooManyRequests(res);

  // Auth: verify authenticated user via Supabase JWT (consistent with other handlers)
  const auth = await verifyAuth(req);
  if (!auth) {
    apiLog('warn', { api: 'store', reason: 'unauthed', ip });
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }

  const { action, key, value } = req.body || {};
  if (!action || !key) return badRequest(res, "Missing action or key");

  try {
    switch (action) {
      case "get": {
        const data = await getData(key);
        return res.status(200).json({ ok: true, key, value: data });
      }
      case "set": {
        await setData(key, value);
        return res.status(200).json({ key, ok: true });
      }
      case "keys": {
        await ensureDir();
        const files = await readdir(STORE_DIR);
        const keys = files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
        return res.status(200).json({ ok: true, keys });
      }
      default:
        return badRequest(res, `Unknown action: ${action}`);
    }
  } catch (e) {
    apiLog('error', { api: 'store', action }, { error: e.message });
    return res.status(500).json({ ok: false, error: "Internal store error" });
  }
}
