// HubScale — Integration Sync API (Vercel Serverless Function)
// Syncs data from connected third-party integrations

import { createClient } from '@supabase/supabase-js';
import { createDecipheriv } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.VITE_APP_URL || 'https://hubscale.app';
const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY;

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

function decrypt(encoded) {
  if (!encoded || !ENCRYPTION_KEY) return encoded;
  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const buf = Buffer.from(encoded, 'base64');
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext, undefined, 'utf8') + decipher.final('utf8');
  } catch {
    return encoded; // Fallback for unencrypted legacy tokens
  }
}

async function verifyAuth(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const sb = getSupabaseAdmin();
  const { data: { user }, error } = await sb.auth.getUser(auth.slice(7));
  if (error || !user) return null;
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  return profile;
}

// ─── Stripe Sync ───

async function syncStripe(sb, orgId, accessToken) {
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(accessToken);

  const charges = await stripe.charges.list({ limit: 100 });
  const rows = (charges.data || []).map((c) => ({
    org_id: orgId,
    source: 'stripe',
    external_id: c.id,
    amount: c.amount / 100,
    currency: c.currency,
    status: c.status,
    description: c.description || '',
    created_at: new Date(c.created * 1000).toISOString(),
  }));

  if (rows.length > 0) {
    await sb.from('financial_history').upsert(rows, { onConflict: 'org_id,source,external_id' });
  }

  return { synced: rows.length };
}

// ─── Google Calendar Sync ───

async function syncGoogleCalendar(sb, orgId, accessToken) {
  const now = new Date().toISOString();
  const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax: now,
    maxResults: '250',
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!calRes.ok) {
    const err = await calRes.text();
    throw new Error(`Google Calendar API error: ${calRes.status} — ${err}`);
  }

  const data = await calRes.json();
  const items = data.items || [];

  const rows = items.map((ev) => ({
    org_id: orgId,
    source: 'google_calendar',
    external_id: ev.id,
    title: ev.summary || '',
    description: ev.description || '',
    start_at: ev.start?.dateTime || ev.start?.date || null,
    end_at: ev.end?.dateTime || ev.end?.date || null,
    location: ev.location || '',
    metadata: { htmlLink: ev.htmlLink, status: ev.status },
  }));

  if (rows.length > 0) {
    await sb.from('events').upsert(rows, { onConflict: 'org_id,source,external_id' });
  }

  return { synced: rows.length };
}

// ─── HubSpot Sync ───

async function syncHubSpot(sb, orgId, accessToken) {
  const hsRes = await fetch(
    'https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone,company',
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!hsRes.ok) {
    const err = await hsRes.text();
    throw new Error(`HubSpot API error: ${hsRes.status} — ${err}`);
  }

  const data = await hsRes.json();
  const results = data.results || [];

  const rows = results.map((c) => ({
    org_id: orgId,
    source: 'hubspot',
    external_id: c.id,
    first_name: c.properties?.firstname || '',
    last_name: c.properties?.lastname || '',
    email: c.properties?.email || '',
    phone: c.properties?.phone || '',
    company: c.properties?.company || '',
    metadata: { hs_created_at: c.createdAt, hs_updated_at: c.updatedAt },
  }));

  if (rows.length > 0) {
    await sb.from('contacts').upsert(rows, { onConflict: 'org_id,source,external_id' });
  }

  return { synced: rows.length };
}

// ─── Sync Dispatcher ───

const SYNC_HANDLERS = {
  stripe: syncStripe,
  'google calendar': syncGoogleCalendar,
  hubspot: syncHubSpot,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', APP_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const profile = await verifyAuth(req);
    if (!profile) return res.status(401).json({ error: 'Non autorisé' });

    const { integration } = req.body;
    const name = (integration || '').toLowerCase();

    // Check if sync is supported for this integration
    const syncFn = SYNC_HANDLERS[name];
    if (!syncFn) {
      return res.status(400).json({ error: `Sync non supporté pour ${name}` });
    }

    // Fetch stored integration from DB
    const sb = getSupabaseAdmin();
    const { data: integ, error: integError } = await sb
      .from('integrations')
      .select('*')
      .eq('org_id', profile.org_id)
      .eq('name', name)
      .single();

    if (integError || !integ) {
      return res.status(404).json({ error: `Intégration ${name} introuvable` });
    }

    if (!integ.connected) {
      return res.status(400).json({ error: `Intégration ${name} non connectée` });
    }

    // Decrypt access token
    const accessToken = decrypt(integ.access_token_enc);
    if (!accessToken) {
      return res.status(400).json({ error: 'Token d\'accès manquant' });
    }

    // Run the sync handler
    const result = await syncFn(sb, profile.org_id, accessToken);

    // Update last_synced_at
    await sb.from('integrations').update({
      last_synced_at: new Date().toISOString(),
    }).eq('org_id', profile.org_id).eq('name', name);

    // Log to sync_history
    await sb.from('sync_history').insert({
      org_id: profile.org_id,
      integration_name: name,
      action: 'sync',
      details: `Synced ${result.synced} records`,
    });

    return res.status(200).json({ ok: true, synced: result.synced, source: name });
  } catch (err) {
    console.error('[sync]', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
