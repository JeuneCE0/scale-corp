// GHL Webhook receiver — with HMAC signature verification
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { createHmac, timingSafeEqual } from 'crypto';
import { applyHeaders, verifyAuth, getClientIP, rateLimit, apiLog, tooManyRequests } from './_middleware.js';

// Note: /tmp is ephemeral in Vercel serverless. Events are lost on cold starts.
// For persistent storage, consider using Supabase or another database.
const EVENTS_FILE = '/tmp/ghl-events.json';
const MAX_EVENTS = 50;

let recentEvents = globalThis.__ghlEvents || [];
globalThis.__ghlEvents = recentEvents;

/**
 * Verify webhook signature using HMAC-SHA256 or simple header secret
 */
function verifyWebhookSignature(req) {
  const secret = process.env.GHL_WEBHOOK_SECRET;
  if (!secret) return false;

  // Simple header secret mode
  const headerSecret = req.headers['x-webhook-secret'];
  if (headerSecret && headerSecret === secret) return true;

  // HMAC signature mode (preferred)
  const signature = req.headers['x-ghl-signature'] || req.headers['x-webhook-signature'];
  if (signature && req.body) {
    try {
      const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const expected = createHmac('sha256', secret).update(payload).digest('hex');
      // Timing-safe comparison
      if (signature.length === expected.length) {
        try {
          if (timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return true;
        } catch { /* invalid signature format */ }
      }
    } catch { /* invalid signature format */ }
  }

  return false;
}

async function persistEvents(events) {
  try { await writeFile(EVENTS_FILE, JSON.stringify(events), 'utf8'); } catch { /* ok */ }
}

async function loadEvents() {
  try {
    if (existsSync(EVENTS_FILE)) {
      return JSON.parse(await readFile(EVENTS_FILE, 'utf8'));
    }
  } catch { /* corrupted file */ }
  return [];
}

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ip = getClientIP(req);

  // GET = read recent events (auth required — contains PII)
  if (req.method === 'GET') {
    if (!rateLimit('webhook_read', ip, 30)) return tooManyRequests(res);
    const auth = await verifyAuth(req);
    if (!auth) {
      apiLog('warn', { api: 'webhook-ghl', reason: 'unauthed GET', ip });
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (recentEvents.length === 0) {
      recentEvents = await loadEvents();
      globalThis.__ghlEvents = recentEvents;
    }
    return res.status(200).json({ events: recentEvents, count: recentEvents.length });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!rateLimit('webhook_write', ip, 100)) return tooManyRequests(res);

  // Verify webhook authenticity
  if (!verifyWebhookSignature(req)) {
    apiLog('warn', { api: 'webhook-ghl', reason: 'unauthorized', ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Replay protection: reject webhooks older than 5 minutes
  const timestamp = req.headers['x-ghl-timestamp'] || req.headers['x-webhook-timestamp'];
  if (timestamp) {
    const age = Date.now() - new Date(timestamp).getTime();
    if (isNaN(age) || age > 5 * 60 * 1000 || age < -60 * 1000) {
      return res.status(401).json({ ok: false, error: 'Webhook timestamp expired or invalid' });
    }
  }

  const body = req.body || {};
  if (typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Invalid webhook body' });
  }

  const event = {
    type: body.type || body.event || body.workflow?.name || 'unknown',
    contactId: body.contact_id || body.contactId || body.id,
    contactName: body.contact_name || body.contactName || body.full_name || body.name || body.first_name,
    contactEmail: body.email || body.contact_email,
    phone: body.phone || body.contact_phone,
    locationId: body.location_id || body.locationId,
    data: body,
    receivedAt: new Date().toISOString(),
  };

  // Store in memory
  recentEvents.unshift(event);
  if (recentEvents.length > MAX_EVENTS) recentEvents = recentEvents.slice(0, MAX_EVENTS);
  globalThis.__ghlEvents = recentEvents;

  // Persist for cross-instance reads
  await persistEvents(recentEvents);

  return res.status(200).json({ ok: true, event: event.type });
}
