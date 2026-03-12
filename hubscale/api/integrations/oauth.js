// HubScale — Integration OAuth API (Vercel Serverless Function)
// Handles OAuth flows for third-party integrations

import { createClient } from '@supabase/supabase-js';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.VITE_APP_URL || 'https://hubscale.app';

// OAuth configs per integration (add real values in env)
const OAUTH_CONFIGS = {
  // --- Paiements ---
  stripe: {
    authorizeUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    clientId: process.env.STRIPE_CLIENT_ID,
    clientSecret: process.env.STRIPE_SECRET_KEY,
    scopes: 'read_write',
    extraParams: { stripe_landing: 'login' },
  },
  paypal: {
    authorizeUrl: 'https://www.paypal.com/signin/authorize',
    tokenUrl: 'https://api-m.paypal.com/v1/oauth2/token',
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    scopes: 'openid email https://uri.paypal.com/services/reporting/search/read',
    tokenExchangeMethod: 'basic_auth',
  },
  shopify: {
    authorizeUrl: null, // Per-store URL: https://{shop}.myshopify.com/admin/oauth/authorize
    tokenUrl: null, // Per-store URL: https://{shop}.myshopify.com/admin/oauth/access_token
    clientId: process.env.SHOPIFY_CLIENT_ID,
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
    scopes: 'read_orders,read_products,read_customers',
    requiresShopDomain: true,
  },
  // --- Banque & Comptabilité ---
  revolut: {
    authorizeUrl: 'https://business.revolut.com/app-confirm',
    tokenUrl: 'https://b2b.revolut.com/api/1.0/auth/token',
    clientId: process.env.REVOLUT_OAUTH_CLIENT_ID,
    clientSecret: process.env.REVOLUT_OAUTH_CLIENT_SECRET,
    scopes: 'accounts:read transactions:read',
  },
  qonto: {
    authorizeUrl: 'https://connect.qonto.com/oauth2/auth',
    tokenUrl: 'https://connect.qonto.com/oauth2/token',
    clientId: process.env.QONTO_OAUTH_CLIENT_ID,
    clientSecret: process.env.QONTO_OAUTH_CLIENT_SECRET,
    scopes: 'offline_access transactions:read balances:read organization:read',
  },
  // --- Agenda ---
  'google calendar': {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    scopes: 'https://www.googleapis.com/auth/calendar.readonly',
    extraParams: { access_type: 'offline', prompt: 'consent' },
  },
  // --- CRM ---
  gohighlevel: {
    authorizeUrl: 'https://marketplace.gohighlevel.com/oauth/chooselocation',
    tokenUrl: 'https://services.leadconnectorhq.com/oauth/token',
    clientId: process.env.GHL_OAUTH_CLIENT_ID,
    clientSecret: process.env.GHL_OAUTH_CLIENT_SECRET,
    scopes: 'contacts.readonly contacts.write opportunities.readonly opportunities.write calendars.readonly calendars/events.readonly conversations.readonly conversations/message.write locations.readonly',
    extraParams: { userType: 'Location' },
  },
  hubspot: {
    authorizeUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    clientId: process.env.HUBSPOT_CLIENT_ID,
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
    scopes: 'crm.objects.contacts.read crm.objects.deals.read',
  },
  salesforce: {
    authorizeUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    clientId: process.env.SALESFORCE_CLIENT_ID,
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
    scopes: 'api refresh_token',
  },
  pipedrive: {
    authorizeUrl: 'https://oauth.pipedrive.com/oauth/authorize',
    tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
    clientId: process.env.PIPEDRIVE_CLIENT_ID,
    clientSecret: process.env.PIPEDRIVE_CLIENT_SECRET,
    scopes: '',
  },
  zoho: {
    authorizeUrl: 'https://accounts.zoho.eu/oauth/v2/auth',
    tokenUrl: 'https://accounts.zoho.eu/oauth/v2/token',
    clientId: process.env.ZOHO_CLIENT_ID,
    clientSecret: process.env.ZOHO_CLIENT_SECRET,
    scopes: 'ZohoCRM.modules.ALL ZohoCRM.settings.ALL',
    extraParams: { access_type: 'offline', prompt: 'consent' },
  },
  brevo: {
    authorizeUrl: 'https://app.brevo.com/oauth2/authorize',
    tokenUrl: 'https://app.brevo.com/oauth2/token',
    clientId: process.env.BREVO_CLIENT_ID,
    clientSecret: process.env.BREVO_CLIENT_SECRET,
    scopes: 'contacts:read contacts:write',
  },
  // --- Email Marketing ---
  mailchimp: {
    authorizeUrl: 'https://login.mailchimp.com/oauth2/authorize',
    tokenUrl: 'https://login.mailchimp.com/oauth2/token',
    clientId: process.env.MAILCHIMP_CLIENT_ID,
    clientSecret: process.env.MAILCHIMP_CLIENT_SECRET,
    scopes: '',
  },
  activecampaign: {
    authorizeUrl: 'https://app.activecampaign.com/oauth2/authorize',
    tokenUrl: 'https://app.activecampaign.com/oauth2/token',
    clientId: process.env.ACTIVECAMPAIGN_CLIENT_ID,
    clientSecret: process.env.ACTIVECAMPAIGN_CLIENT_SECRET,
    scopes: '',
  },
  // --- Publicité ---
  'meta ads': {
    authorizeUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
    clientId: process.env.META_APP_ID,
    clientSecret: process.env.META_APP_SECRET,
    scopes: 'ads_read ads_management read_insights business_management',
    exchangeLongLived: true,
  },
  'google ads': {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_ADS_CLIENT_ID,
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    scopes: 'https://www.googleapis.com/auth/adwords',
    extraParams: { access_type: 'offline', prompt: 'consent' },
  },
  'tiktok ads': {
    authorizeUrl: 'https://business-api.tiktok.com/portal/auth',
    tokenUrl: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
    clientId: process.env.TIKTOK_APP_ID,
    clientSecret: process.env.TIKTOK_APP_SECRET,
    scopes: '',
    customTokenExchange: 'tiktok',
  },
  'linkedin ads': {
    authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    scopes: 'r_ads r_ads_reporting r_organization_social',
  },
  // --- Projet ---
  notion: {
    authorizeUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    clientId: process.env.NOTION_CLIENT_ID,
    clientSecret: process.env.NOTION_CLIENT_SECRET,
    scopes: '',
    tokenExchangeMethod: 'basic_auth',
    owner: 'user',
  },
  slack: {
    authorizeUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    scopes: 'channels:read chat:write incoming-webhook',
  },
};

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY;

function encrypt(plaintext) {
  if (!plaintext || !ENCRYPTION_KEY) return plaintext;
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', APP_URL);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: OAuth provider redirects here with ?code=...&state=...
  if (req.method === 'GET') {
    const { code, state, error: oauthError } = req.query || {};
    if (oauthError) {
      return res.redirect(302, `${APP_URL}?tab=settings&oauth=error&error=${encodeURIComponent(oauthError)}`);
    }
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
      const name = stateData.integration;
      const orgId = stateData.org_id;
      const userId = stateData.user_id;
      if (!name || !orgId) {
        return res.redirect(302, `${APP_URL}?tab=settings&oauth=error&error=invalid_state`);
      }
      // Build a fake profile for handleCallback
      const profile = { org_id: orgId, id: userId };
      await handleCallbackInternal(res, profile, name, code);
    } catch (err) {
      console.error('[oauth] GET callback error:', err);
      return res.redirect(302, `${APP_URL}?tab=settings&oauth=error&error=callback_failed`);
    }
    return;
  }

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
  if (!config.authorizeUrl) {
    return res.status(400).json({ error: `OAuth pour ${name} nécessite une configuration manuelle` });
  }

  const state = Buffer.from(JSON.stringify({
    org_id: profile.org_id,
    user_id: profile.id,
    integration: name,
    ts: Date.now(),
  })).toString('base64url');

  const redirectUri = `${APP_URL}/api/integrations/oauth`;

  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
  });

  // TikTok uses app_id instead of client_id
  if (config.customTokenExchange === 'tiktok') {
    params.set('app_id', config.clientId);
  } else {
    params.set('client_id', config.clientId);
  }

  if (config.scopes) {
    params.set('scope', config.scopes);
  }

  // Provider-specific extra authorization params
  if (config.extraParams) {
    for (const [k, v] of Object.entries(config.extraParams)) {
      params.set(k, v);
    }
  }

  return res.status(200).json({ url: `${config.authorizeUrl}?${params}` });
}

async function handleCallback(res, profile, name, code) {
  return handleCallbackInternal(res, profile, name, code, false);
}

async function handleCallbackInternal(res, profile, name, code, isGetRedirect = true) {
  const config = OAUTH_CONFIGS[name];
  if (!config) {
    if (isGetRedirect) return res.redirect(302, `${APP_URL}?tab=settings&oauth=error&error=unknown_integration`);
    return res.status(400).json({ error: 'Integration inconnue' });
  }

  const redirectUri = `${APP_URL}/api/integrations/oauth`;
  let tokens;

  // TikTok uses JSON body with app_id/secret instead of standard OAuth
  if (config.customTokenExchange === 'tiktok') {
    const tiktokRes = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: config.clientId, secret: config.clientSecret, auth_code: code }),
    });
    if (!tiktokRes.ok) {
      console.error(`[oauth] TikTok token exchange failed: ${tiktokRes.status}`);
      if (isGetRedirect) return res.redirect(302, `${APP_URL}?tab=settings&oauth=error&error=tiktok_token_failed`);
      return res.status(400).json({ error: 'Échec de l\'autorisation TikTok' });
    }
    const tiktokData = await tiktokRes.json();
    if (tiktokData.code !== 0) {
      if (isGetRedirect) return res.redirect(302, `${APP_URL}?tab=settings&oauth=error&error=tiktok_error`);
      return res.status(400).json({ error: tiktokData.message || 'Erreur TikTok' });
    }
    tokens = {
      access_token: tiktokData.data?.access_token,
      scope: (tiktokData.data?.scope || []).join(','),
      advertiser_ids: tiktokData.data?.advertiser_ids || [],
    };
  } else {
    // Standard OAuth2 token exchange
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    // Some providers (Notion, PayPal) use HTTP Basic Auth for token exchange
    if (config.tokenExchangeMethod === 'basic_auth') {
      headers.Authorization = 'Basic ' + Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    } else {
      body.set('client_id', config.clientId);
      body.set('client_secret', config.clientSecret);
    }

    // Stripe doesn't use redirect_uri in token exchange
    if (name === 'stripe') {
      body.delete('redirect_uri');
    }

    const tokenRes = await fetch(config.tokenUrl, {
      method: 'POST',
      headers,
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error(`[oauth] Token exchange failed for ${name}:`, err);
      if (isGetRedirect) return res.redirect(302, `${APP_URL}?tab=settings&oauth=error&error=token_exchange_failed`);
      return res.status(400).json({ error: 'Échec de l\'autorisation' });
    }

    tokens = await tokenRes.json();
  }

  // Meta: exchange short-lived token for long-lived token (60 days)
  if (config.exchangeLongLived && tokens.access_token) {
    try {
      const llRes = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${config.clientId}&client_secret=${config.clientSecret}&fb_exchange_token=${tokens.access_token}`
      );
      if (llRes.ok) {
        const llData = await llRes.json();
        tokens.access_token = llData.access_token;
        tokens.expires_in = llData.expires_in || 5184000; // 60 days
      }
    } catch { /* keep short-lived token */ }

    // Fetch ad accounts for Meta
    try {
      const acctRes = await fetch(
        `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_id,currency,business_name&access_token=${tokens.access_token}`
      );
      if (acctRes.ok) {
        const acctData = await acctRes.json();
        tokens.ad_accounts = acctData.data || [];
      }
    } catch { /* ignore */ }
  }

  // Store tokens securely in DB
  const sb = getSupabaseAdmin();
  const metadata = { scope: tokens.scope || config.scopes };
  // Store provider-specific metadata
  if (tokens.ad_accounts) metadata.ad_accounts = tokens.ad_accounts;
  if (tokens.advertiser_ids) metadata.advertiser_ids = tokens.advertiser_ids;
  if (tokens.locationId) metadata.location_id = tokens.locationId;
  if (tokens.stripe_user_id) metadata.stripe_user_id = tokens.stripe_user_id;

  await sb.from('integrations').upsert({
    org_id: profile.org_id,
    name,
    connected: true,
    access_token_enc: encrypt(tokens.access_token),
    refresh_token_enc: encrypt(tokens.refresh_token || ''),
    token_expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    last_synced_at: new Date().toISOString(),
    metadata,
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

  if (isGetRedirect) {
    return res.redirect(302, `${APP_URL}?tab=settings&oauth=success&integration=${encodeURIComponent(name)}`);
  }
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

export { decrypt as decryptToken };
