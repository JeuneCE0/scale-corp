// HubScale — Integration OAuth API (Vercel Serverless Function)
// Handles OAuth flows for third-party integrations

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.VITE_APP_URL || 'https://hubscale.app';

// OAuth configs per integration (add real values in env)
const OAUTH_CONFIGS = {
  stripe: {
    authorizeUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    clientId: process.env.STRIPE_CLIENT_ID,
    clientSecret: process.env.STRIPE_SECRET_KEY,
    scopes: 'read_write',
  },
  'google calendar': {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    scopes: 'https://www.googleapis.com/auth/calendar.readonly',
  },
  hubspot: {
    authorizeUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    clientId: process.env.HUBSPOT_CLIENT_ID,
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
    scopes: 'crm.objects.contacts.read crm.objects.deals.read',
  },
  slack: {
    authorizeUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    scopes: 'channels:read chat:write',
  },
};

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', APP_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const profile = await verifyAuth(req);
    if (!profile) return res.status(401).json({ error: 'Non autorisé' });

    const { action, integration, code } = req.body;
    const name = (integration || '').toLowerCase();

    if (action === 'start') {
      return startOAuth(res, profile, name);
    } else if (action === 'callback') {
      return handleCallback(res, profile, name, code);
    } else if (action === 'disconnect') {
      return handleDisconnect(res, profile, name);
    }

    return res.status(400).json({ error: 'Action invalide' });
  } catch (err) {
    console.error('[oauth]', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

function startOAuth(res, profile, name) {
  const config = OAUTH_CONFIGS[name];
  if (!config || !config.clientId) {
    return res.status(400).json({ error: `OAuth non configuré pour ${name}` });
  }

  const state = Buffer.from(JSON.stringify({
    org_id: profile.org_id,
    user_id: profile.id,
    integration: name,
    ts: Date.now(),
  })).toString('base64url');

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${APP_URL}/api/integrations/oauth?action=callback`,
    response_type: 'code',
    scope: config.scopes,
    state,
  });

  return res.status(200).json({ url: `${config.authorizeUrl}?${params}` });
}

async function handleCallback(res, profile, name, code) {
  const config = OAUTH_CONFIGS[name];
  if (!config) return res.status(400).json({ error: 'Integration inconnue' });

  // Exchange code for tokens
  const tokenRes = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: `${APP_URL}/api/integrations/oauth?action=callback`,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error(`[oauth] Token exchange failed for ${name}:`, err);
    return res.status(400).json({ error: 'Échec de l\'autorisation' });
  }

  const tokens = await tokenRes.json();

  // Store tokens securely in DB
  const sb = getSupabaseAdmin();
  await sb.from('integrations').upsert({
    org_id: profile.org_id,
    name,
    connected: true,
    access_token_enc: tokens.access_token, // TODO: encrypt with AES-256 using a server key
    refresh_token_enc: tokens.refresh_token || null,
    token_expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    last_synced_at: new Date().toISOString(),
    metadata: { scope: tokens.scope || config.scopes },
  }, { onConflict: 'org_id,name' });

  // Log
  await sb.from('sync_history').insert({
    org_id: profile.org_id,
    integration_name: name,
    action: 'connect',
    details: 'OAuth authorization completed',
  });

  await sb.from('audit_log').insert({
    org_id: profile.org_id,
    user_id: profile.id,
    action: 'integration_connected',
    entity_type: 'integration',
    details: { integration: name },
  });

  return res.status(200).json({ ok: true, integration: name });
}

async function handleDisconnect(res, profile, name) {
  const sb = getSupabaseAdmin();

  await sb.from('integrations').update({
    connected: false,
    access_token_enc: null,
    refresh_token_enc: null,
    token_expires_at: null,
  }).eq('org_id', profile.org_id).eq('name', name);

  await sb.from('sync_history').insert({
    org_id: profile.org_id,
    integration_name: name,
    action: 'disconnect',
  });

  await sb.from('audit_log').insert({
    org_id: profile.org_id,
    user_id: profile.id,
    action: 'integration_disconnected',
    entity_type: 'integration',
    details: { integration: name },
  });

  return res.status(200).json({ ok: true });
}
