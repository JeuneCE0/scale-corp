// HubScale — Integration OAuth API (Vercel Serverless Function)
// Handles OAuth flows for third-party integrations

import { getSupabaseAdmin } from '../utils/supabase.js';
import { verifyAuth } from '../utils/auth.js';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

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
  // --- E-commerce ---
  woocommerce: {
    authorizeUrl: null, // WooCommerce uses REST API with consumer key/secret, not standard OAuth
    tokenUrl: null,
    clientId: process.env.WOOCOMMERCE_CONSUMER_KEY,
    clientSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
    scopes: 'read',
    requiresApiKey: true, // Connected via API key (consumer key + store URL)
  },
  // --- Gestion de projet ---
  asana: {
    authorizeUrl: 'https://app.asana.com/-/oauth_authorize',
    tokenUrl: 'https://app.asana.com/-/oauth_token',
    clientId: process.env.ASANA_CLIENT_ID,
    clientSecret: process.env.ASANA_CLIENT_SECRET,
    scopes: '',
  },
  trello: {
    authorizeUrl: 'https://trello.com/1/authorize',
    tokenUrl: null, // Trello uses API key + token (not standard OAuth token exchange)
    clientId: process.env.TRELLO_API_KEY,
    clientSecret: process.env.TRELLO_API_SECRET,
    scopes: 'read',
    requiresApiKey: true, // Connected via API key + token
    extraParams: { expiration: 'never', name: 'HubScale', response_type: 'token' },
  },
  monday: {
    authorizeUrl: 'https://auth.monday.com/oauth2/authorize',
    tokenUrl: 'https://auth.monday.com/oauth2/token',
    clientId: process.env.MONDAY_CLIENT_ID,
    clientSecret: process.env.MONDAY_CLIENT_SECRET,
    scopes: 'boards:read workspaces:read users:read',
  },
  jira: {
    authorizeUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    clientId: process.env.JIRA_CLIENT_ID,
    clientSecret: process.env.JIRA_CLIENT_SECRET,
    scopes: 'read:jira-work read:jira-user offline_access',
    extraParams: { audience: 'api.atlassian.com', prompt: 'consent' },
  },
  // --- Support Client ---
  zendesk: {
    authorizeUrl: null, // Per-subdomain URL: https://{subdomain}.zendesk.com/oauth/authorizations/new
    tokenUrl: null, // Per-subdomain URL: https://{subdomain}.zendesk.com/oauth/tokens
    clientId: process.env.ZENDESK_CLIENT_ID,
    clientSecret: process.env.ZENDESK_CLIENT_SECRET,
    scopes: 'read tickets:read users:read',
    requiresSubdomain: true,
  },
  freshdesk: {
    authorizeUrl: null, // Freshdesk uses API key authentication, not OAuth
    tokenUrl: null,
    clientId: null,
    clientSecret: null,
    scopes: '',
    requiresApiKey: true, // Connected via API key + domain
  },
  intercom: {
    authorizeUrl: 'https://app.intercom.com/oauth',
    tokenUrl: 'https://api.intercom.io/auth/eagle/token',
    clientId: process.env.INTERCOM_CLIENT_ID,
    clientSecret: process.env.INTERCOM_CLIENT_SECRET,
    scopes: '',
  },
};

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

// In-memory rate limiter for OAuth endpoints
const _oauthRateMap = new Map();
function checkOAuthRateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const entry = _oauthRateMap.get(key);
  if (!entry || now - entry.start > windowMs) {
    _oauthRateMap.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', APP_URL);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate limit OAuth requests (10/min per IP)
  const ip = getClientIP(req);
  if (!checkOAuthRateLimit(`oauth_${ip}`, 10, 60000)) {
    return res.status(429).json({ error: 'Trop de requêtes. Réessayez dans quelques instants.' });
  }

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
      // Reject state tokens older than 10 minutes to prevent replay attacks
      if (stateData.ts && (Date.now() - stateData.ts) > 10 * 60 * 1000) {
        return res.redirect(302, `${APP_URL}?tab=settings&oauth=error&error=state_expired`);
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

    const { action, integration, code, apiKey, apiUrl } = req.body;
    const name = (integration || '').toLowerCase();

    if (action === 'start') {
      return startOAuth(res, profile, name);
    } else if (action === 'callback') {
      return handleCallback(res, profile, name, code);
    } else if (action === 'connect_with_key') {
      return handleConnectWithKey(res, profile, name, apiKey, apiUrl);
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

async function handleConnectWithKey(res, profile, name, apiKey, apiUrl) {
  if (!apiKey) {
    return res.status(400).json({ error: 'Clé API requise' });
  }

  // Validate the API key by making a test call
  const validators = {
    stripe: async () => {
      const r = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!r.ok) throw new Error('Clé Stripe invalide');
      return {};
    },
    revolut: async () => {
      const r = await fetch('https://b2b.revolut.com/api/1.0/accounts', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!r.ok) throw new Error('Token Revolut invalide');
      return {};
    },
    qonto: async () => {
      const url = apiUrl || 'https://thirdparty.qonto.com/v2';
      const r = await fetch(`${url}/organization`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!r.ok) throw new Error('Clé Qonto invalide');
      return {};
    },
    hubspot: async () => {
      const r = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!r.ok) throw new Error('Clé HubSpot invalide');
      return {};
    },
    mailchimp: async () => {
      // Mailchimp API key contains dc suffix: key-us21
      const dc = apiKey.includes('-') ? apiKey.split('-').pop() : 'us1';
      const r = await fetch(`https://${dc}.api.mailchimp.com/3.0/ping`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!r.ok) throw new Error('Clé Mailchimp invalide');
      return { dc };
    },
    brevo: async () => {
      const r = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'api-key': apiKey },
      });
      if (!r.ok) throw new Error('Clé Brevo invalide');
      return {};
    },
    pipedrive: async () => {
      const r = await fetch(`https://api.pipedrive.com/v1/users/me?api_token=${apiKey}`);
      if (!r.ok) throw new Error('Clé Pipedrive invalide');
      return {};
    },
    salesforce: async () => {
      if (!apiUrl) throw new Error('URL d\'instance Salesforce requise');
      const r = await fetch(`${apiUrl}/services/data/v59.0/`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!r.ok) throw new Error('Token Salesforce invalide');
      return {};
    },
    zoho: async () => {
      const r = await fetch('https://www.zohoapis.eu/crm/v2/org', {
        headers: { Authorization: `Zoho-oauthtoken ${apiKey}` },
      });
      if (!r.ok) throw new Error('Token Zoho invalide');
      return {};
    },
    activecampaign: async () => {
      if (!apiUrl) throw new Error('URL ActiveCampaign requise (ex: https://moncompte.api-us1.com)');
      const r = await fetch(`${apiUrl}/api/3/contacts?limit=1`, {
        headers: { 'Api-Token': apiKey },
      });
      if (!r.ok) throw new Error('Clé ActiveCampaign invalide');
      return { api_url: apiUrl };
    },
    notion: async () => {
      const r = await fetch('https://api.notion.com/v1/users/me', {
        headers: { Authorization: `Bearer ${apiKey}`, 'Notion-Version': '2022-06-28' },
      });
      if (!r.ok) throw new Error('Token Notion invalide');
      return {};
    },
    shopify: async () => {
      if (!apiUrl) throw new Error('URL de boutique Shopify requise (ex: monshop.myshopify.com)');
      const shopDomain = apiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const r = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
        headers: { 'X-Shopify-Access-Token': apiKey },
      });
      if (!r.ok) throw new Error('Token Shopify invalide');
      return { shop_domain: shopDomain };
    },
    woocommerce: async () => {
      if (!apiUrl) throw new Error('URL de boutique WooCommerce requise (ex: https://monshop.com)');
      const storeUrl = apiUrl.replace(/\/$/, '');
      const r = await fetch(`${storeUrl}/wp-json/wc/v3/system_status`, {
        headers: { Authorization: 'Basic ' + Buffer.from(`${apiKey}:${apiUrl.includes(':') ? '' : process.env.WOOCOMMERCE_CONSUMER_SECRET || ''}`).toString('base64') },
      });
      if (!r.ok) throw new Error('Clé WooCommerce invalide');
      return { store_url: storeUrl };
    },
    trello: async () => {
      const r = await fetch(`https://api.trello.com/1/members/me?key=${process.env.TRELLO_API_KEY || ''}&token=${apiKey}`);
      if (!r.ok) throw new Error('Token Trello invalide');
      return {};
    },
    freshdesk: async () => {
      if (!apiUrl) throw new Error('Domaine Freshdesk requis (ex: monentreprise.freshdesk.com)');
      const domain = apiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const r = await fetch(`https://${domain}/api/v2/tickets?per_page=1`, {
        headers: { Authorization: 'Basic ' + Buffer.from(`${apiKey}:X`).toString('base64') },
      });
      if (!r.ok) throw new Error('Clé Freshdesk invalide');
      return { domain };
    },
    zendesk: async () => {
      if (!apiUrl) throw new Error('Sous-domaine Zendesk requis (ex: monentreprise.zendesk.com)');
      const subdomain = apiUrl.replace(/^https?:\/\//, '').replace(/\.zendesk\.com.*$/, '');
      const r = await fetch(`https://${subdomain}.zendesk.com/api/v2/tickets?per_page=1`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!r.ok) throw new Error('Token Zendesk invalide');
      return { subdomain };
    },
    intercom: async () => {
      const r = await fetch('https://api.intercom.io/me', {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      });
      if (!r.ok) throw new Error('Token Intercom invalide');
      return {};
    },
  };

  let metadata = { connection_method: 'api_key' };
  const validator = validators[name];
  if (validator) {
    try {
      const extra = await validator();
      // Store metadata if validator returned extra info
      metadata = { ...extra, connection_method: 'api_key' };
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  // Store the API key securely
  const sb = getSupabaseAdmin();
  await sb.from('integrations').upsert({
    org_id: profile.org_id,
    name,
    connected: true,
    access_token_enc: encrypt(apiKey),
    refresh_token_enc: null,
    token_expires_at: null,
    last_synced_at: new Date().toISOString(),
    metadata,
  }, { onConflict: 'org_id,name' });

  await sb.from('sync_history').insert({
    org_id: profile.org_id,
    integration_name: name,
    action: 'connect',
    details: 'Connected with API key',
  });

  await sb.from('audit_log').insert({
    org_id: profile.org_id,
    user_id: profile.id,
    action: 'integration_connected',
    entity_type: 'integration',
    details: { integration: name, method: 'api_key' },
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

export { decrypt as decryptToken };
