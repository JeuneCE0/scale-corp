// Vercel Serverless — JSON KV Store (file-based for /tmp, or use Vercel KV later)
// Stores user data server-side so it persists across devices/browsers

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const STORE_DIR = '/tmp/scale-store';
const AUTH_TOKEN = process.env.STORE_SECRET || 'scale2026';

async function ensureDir() {
  try { await mkdir(STORE_DIR, { recursive: true }); } catch {}
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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Simple auth
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { action, key, value } = req.body || {};

  if (!action || !key) return res.status(400).json({ error: "Missing action or key" });

  try {
    switch (action) {
      case "get": {
        const data = await getData(key);
        return res.status(200).json({ key, value: data });
      }
      case "set": {
        await setData(key, value);
        return res.status(200).json({ key, ok: true });
      }
      case "keys": {
        const { readdir } = await import('fs/promises');
        await ensureDir();
        const files = await readdir(STORE_DIR);
        const keys = files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
        return res.status(200).json({ keys });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (e) {
    console.error("Store error:", e.message);
    return res.status(500).json({ error: "Internal store error" });
  }
}
