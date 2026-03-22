// Vercel Serverless — Unified OAuth2 Connection Flow
// Supports: GHL, Revolut Business, Qonto
// Flow: /api/oauth?provider=ghl&action=authorize&societyId=leadx
//    → redirect to provider
//    → callback: /api/oauth?provider=ghl&action=callback&code=xxx&state=yyy
//    → stores token in Supabase api_tokens table
//    → redirects back to app with success/error

import crypto from 'crypto';
import { applyHeaders, verifyAuth, rateLimit, getClientIP, apiLog, tooManyRequests, badRequest, fetchWithTimeout } from './_middleware.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// --- Provider Configurations ---

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function getProviderConfig(provider, baseUrl) {
  const configs = {
    ghl: {
      name: 'GoHighLevel',
      clientId: process.env.GHL_OAUTH_CLIENT_ID,
      clientSecret: process.env.GHL_OAUTH_CLIENT_SECRET,
      authorizeUrl: 'https://marketplace.gohighlevel.com/oauth/chooselocation',
      tokenUrl: 'https://services.leadconnectorhq.com/oauth/token',
      scopes: [
        'contacts.readonly', 'contacts.write',
        'opportunities.readonly', 'opportunities.write',
        'calendars.readonly', 'calendars/events.readonly',
        'conversations.readonly', 'conversations/message.write',
        'invoices.readonly', 'invoices.write',
        'locations.readonly',
      ],
      redirectUri: `${baseUrl}/api/oauth?provider=ghl&action=callback`,
    },
    revolut: {
      name: 'Revolut Business',
      clientId: process.env.REVOLUT_OAUTH_CLIENT_ID,
      clientSecret: process.env.REVOLUT_OAUTH_CLIENT_SECRET,
      authorizeUrl: 'https://business.revolut.com/app-confirm',
      tokenUrl: 'https://b2b.revolut.com/api/1.0/auth/token',
      scopes: ['accounts:read', 'transactions:read'],
      redirectUri: `${baseUrl}/api/oauth?provider=revolut&action=callback`,
    },
    qonto: {
      name: 'Qonto',
      clientId: process.env.QONTO_OAUTH_CLIENT_ID,
      clientSecret: process.env.QONTO_OAUTH_CLIENT_SECRET,
      authorizeUrl: 'https://connect.qonto.com/oauth2/auth',
      tokenUrl: 'https://connect.qonto.com/oauth2/token',
      scopes: ['offline_access', 'transactions:read', 'balances:read', 'organization:read'],
      redirectUri: `${baseUrl}/api/oauth?provider=qonto&action=callback`,
    },
    meta: {
      name: 'Meta Ads',
      clientId: process.env.META_APP_ID,
      clientSecret: process.env.META_APP_SECRET,
      authorizeUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
      scopes: ['ads_read', 'ads_management', 'read_insights', 'business_management'],
      redirectUri: `${baseUrl}/api/oauth?provider=meta&action=callback`,
      // Meta long-lived tokens last 60 days — we exchange short-lived for long-lived
      exchangeLongLived: true,
    },
    google_ads: {
      name: 'Google Ads',
      clientId: process.env.GOOGLE_ADS_CLIENT_ID,
      clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/adwords'],
      redirectUri: `${baseUrl}/api/oauth?provider=google_ads&action=callback`,
      extraAuthParams: { access_type: 'offline', prompt: 'consent' },
    },
    tiktok: {
      name: 'TikTok Ads',
      clientId: process.env.TIKTOK_APP_ID,
      clientSecret: process.env.TIKTOK_APP_SECRET,
      authorizeUrl: 'https://business-api.tiktok.com/portal/auth',
      tokenUrl: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
      scopes: [],
      redirectUri: `${baseUrl}/api/oauth?provider=tiktok&action=callback`,
      // TikTok uses app_id param instead of client_id
      customAuth: true,
    },
    stripe: {
      name: 'Stripe',
      clientId: process.env.STRIPE_CONNECT_CLIENT_ID,
      clientSecret: process.env.STRIPE_SECRET_KEY,
      authorizeUrl: 'https://connect.stripe.com/oauth/authorize',
      tokenUrl: 'https://connect.stripe.com/oauth/token',
      scopes: ['read_write'],
      redirectUri: `${baseUrl}/api/oauth?provider=stripe&action=callback`,
      extraAuthParams: { stripe_landing: 'login' },
    },
    slack: {
      name: 'Slack',
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      authorizeUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      scopes: ['chat:write', 'channels:read', 'incoming-webhook'],
      redirectUri: `${baseUrl}/api/oauth?provider=slack&action=callback`,
    },
  };
  return configs[provider] || null;
}

const VALID_PROVIDERS = ['ghl', 'revolut', 'qonto', 'meta', 'google_ads', 'tiktok', 'stripe', 'slack'];
const VALID_ACTIONS = ['authorize', 'callback', 'disconnect', 'status'];

// --- Supabase token storage ---

function sbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function storeToken(provider, societyId, tokenData) {
  const payload = {
    id: `${provider}_${societyId}`,
    provider,
    society_id: societyId,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || null,
    token_type: tokenData.token_type || 'Bearer',
    expires_at: tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null,
    scopes: tokenData.scope || '',
    location_id: tokenData.locationId || tokenData.location_id || null,
    company_id: tokenData.companyId || null,
    raw_metadata: JSON.stringify(tokenData),
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const r = await fetch(`${SUPABASE_URL}/rest/v1/api_tokens`, {
    method: 'POST',
    headers: { ...sbHeaders(), Prefer: 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify([payload]),
  });

  if (!r.ok) {
    const text = await r.text();
    apiLog('error', { api: 'oauth', action: 'store_token', provider, societyId }, { error: text });
    return null;
  }
  return await r.json();
}

async function getToken(provider, societyId) {
  const id = `${provider}_${societyId}`;
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/api_tokens?id=eq.${encodeURIComponent(id)}&select=*`,
    { headers: sbHeaders() }
  );
  if (!r.ok) return null;
  const data = await r.json();
  return data?.[0] || null;
}

async function deleteToken(provider, societyId) {
  const id = `${provider}_${societyId}`;
  await fetch(
    `${SUPABASE_URL}/rest/v1/api_tokens?id=eq.${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: sbHeaders() }
  );
}

async function getAllTokens() {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/api_tokens?select=id,provider,society_id,connected_at,expires_at,location_id,company_id,scopes`,
    { headers: sbHeaders() }
  );
  if (!r.ok) return [];
  return await r.json();
}

async function refreshProviderToken(provider, config, storedToken) {
  if (!storedToken?.refresh_token) return null;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: storedToken.refresh_token,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const r = await fetchWithTimeout(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!r.ok) {
    apiLog('warn', { api: 'oauth', action: 'refresh', provider }, { status: r.status });
    return null;
  }

  const tokenData = await r.json();
  // Preserve existing metadata
  tokenData.locationId = storedToken.location_id;
  tokenData.companyId = storedToken.company_id;
  // Keep old refresh token if new one not provided
  if (!tokenData.refresh_token) tokenData.refresh_token = storedToken.refresh_token;

  await storeToken(provider, storedToken.society_id, tokenData);
  return tokenData;
}

// --- State parameter (CSRF protection) ---

function generateState(societyId, provider) {
  const nonce = crypto.randomBytes(24).toString('hex');
  // Encode society + nonce in state; we'll verify nonce format on callback
  return Buffer.from(JSON.stringify({ societyId, provider, nonce })).toString('base64url');
}

function parseState(state) {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString());
  } catch {
    return null;
  }
}

// --- Main handler ---

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ip = getClientIP(req);
  if (!rateLimit('oauth', ip, 20, 60000)) return tooManyRequests(res);

  const { provider, action, code, state, societyId, error: oauthError } = req.query || {};

  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return badRequest(res, `Invalid provider. Supported: ${VALID_PROVIDERS.join(', ')}`);
  }
  if (!action || !VALID_ACTIONS.includes(action)) {
    return badRequest(res, `Invalid action. Supported: ${VALID_ACTIONS.join(', ')}`);
  }

  const baseUrl = getBaseUrl(req);
  const config = getProviderConfig(provider, baseUrl);

  if (!config) return badRequest(res, 'Provider not configured');

  // --- STATUS: return all connections for admin ---
  if (action === 'status') {
    const auth = await verifyAuth(req);
    if (!auth?.isAdmin) return res.status(403).json({ error: 'Admin only' });

    try {
      const tokens = await getAllTokens();
      // Check which providers have OAuth client IDs configured
      const configured = {
        ghl: !!process.env.GHL_OAUTH_CLIENT_ID,
        revolut: !!process.env.REVOLUT_OAUTH_CLIENT_ID,
        qonto: !!process.env.QONTO_OAUTH_CLIENT_ID,
        meta: !!process.env.META_APP_ID,
        google_ads: !!process.env.GOOGLE_ADS_CLIENT_ID,
        tiktok: !!process.env.TIKTOK_APP_ID,
        stripe: !!process.env.STRIPE_CONNECT_CLIENT_ID,
        slack: !!process.env.SLACK_CLIENT_ID,
      };
      return res.status(200).json({ tokens, configured });
    } catch (e) {
      apiLog('error', { api: 'oauth', action: 'status' }, { error: e.message });
      return res.status(500).json({ error: 'Failed to fetch status' });
    }
  }

  // --- DISCONNECT: remove a token ---
  if (action === 'disconnect') {
    const auth = await verifyAuth(req);
    if (!auth?.isAdmin) return res.status(403).json({ error: 'Admin only' });

    const socId = req.body?.societyId || req.query?.societyId;
    if (!socId) return badRequest(res, 'Missing societyId');

    try {
      await deleteToken(provider, socId);
      apiLog('info', { api: 'oauth', action: 'disconnect', provider, societyId: socId });
      return res.status(200).json({ ok: true, message: `${config.name} disconnected for ${socId}` });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to disconnect' });
    }
  }

  // --- AUTHORIZE: redirect user to provider OAuth consent ---
  if (action === 'authorize') {
    if (!config.clientId || !config.clientSecret) {
      return res.status(500).json({
        error: `${config.name} OAuth not configured. Set ${provider.toUpperCase()}_OAUTH_CLIENT_ID and ${provider.toUpperCase()}_OAUTH_CLIENT_SECRET in environment.`,
      });
    }

    // Require admin auth (passed via cookie or header won't work on redirect, so we use state)
    const socId = societyId;
    if (!socId) return badRequest(res, 'Missing societyId param');

    const stateParam = generateState(socId, provider);

    const params = new URLSearchParams({
      response_type: 'code',
      redirect_uri: config.redirectUri,
      state: stateParam,
    });

    // Provider-specific authorization params
    if (provider === 'tiktok') {
      params.set('app_id', config.clientId);
    } else if (provider === 'stripe') {
      params.set('client_id', config.clientId);
      params.set('scope', config.scopes.join(' '));
    } else {
      params.set('client_id', config.clientId);
      params.set('scope', config.scopes.join(' '));
    }

    // GHL-specific: add userType for sub-account selection
    if (provider === 'ghl') {
      params.set('userType', 'Location');
    }

    // Extra auth params (Google: access_type/prompt, Stripe: stripe_landing, etc.)
    if (config.extraAuthParams) {
      for (const [k, v] of Object.entries(config.extraAuthParams)) {
        params.set(k, v);
      }
    }

    const authUrl = `${config.authorizeUrl}?${params.toString()}`;
    apiLog('info', { api: 'oauth', action: 'authorize', provider, societyId: socId });
    return res.redirect(302, authUrl);
  }

  // --- CALLBACK: exchange code for token ---
  if (action === 'callback') {
    // Handle provider errors
    if (oauthError) {
      apiLog('warn', { api: 'oauth', action: 'callback', provider, error: oauthError });
      return res.redirect(302, `${baseUrl}/?oauth=error&provider=${provider}&msg=${encodeURIComponent(oauthError)}`);
    }

    if (!code || !state) {
      return res.redirect(302, `${baseUrl}/?oauth=error&provider=${provider}&msg=missing_code_or_state`);
    }

    const stateData = parseState(state);
    if (!stateData || stateData.provider !== provider) {
      return res.redirect(302, `${baseUrl}/?oauth=error&provider=${provider}&msg=invalid_state`);
    }

    const socId = stateData.societyId;

    try {
      let tokenData;

      if (provider === 'tiktok') {
        // TikTok uses JSON body, not form-encoded
        const tiktokRes = await fetchWithTimeout(config.tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_id: config.clientId, secret: config.clientSecret, auth_code: code }),
        });
        if (!tiktokRes.ok) {
          apiLog('error', { api: 'oauth', action: 'callback', provider }, { status: tiktokRes.status });
          return res.redirect(302, `${baseUrl}/?oauth=error&provider=${provider}&msg=token_exchange_failed`);
        }
        const tiktokData = await tiktokRes.json();
        if (tiktokData.code !== 0) {
          return res.redirect(302, `${baseUrl}/?oauth=error&provider=${provider}&msg=${encodeURIComponent(tiktokData.message || 'tiktok_error')}`);
        }
        tokenData = {
          access_token: tiktokData.data?.access_token,
          advertiser_ids: tiktokData.data?.advertiser_ids || [],
          scope: (tiktokData.data?.scope || []).join(','),
        };
      } else {
        // Standard OAuth2 token exchange
        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: config.redirectUri,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        });

        // Stripe uses a slightly different format
        if (provider === 'stripe') {
          body.delete('redirect_uri');
          body.set('grant_type', 'authorization_code');
        }

        const tokenRes = await fetchWithTimeout(config.tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });

        if (!tokenRes.ok) {
          const errText = await tokenRes.text();
          apiLog('error', { api: 'oauth', action: 'callback', provider }, { status: tokenRes.status, error: errText });
          return res.redirect(302, `${baseUrl}/?oauth=error&provider=${provider}&msg=token_exchange_failed`);
        }

        tokenData = await tokenRes.json();

        // Meta: exchange short-lived token for long-lived token (60 days)
        if (provider === 'meta' && config.exchangeLongLived && tokenData.access_token) {
          try {
            const llParams = new URLSearchParams({
              grant_type: 'fb_exchange_token',
              client_id: config.clientId,
              client_secret: config.clientSecret,
              fb_exchange_token: tokenData.access_token,
            });
            const llRes = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: llParams.toString(),
            });
            if (llRes.ok) {
              const llData = await llRes.json();
              tokenData.access_token = llData.access_token;
              tokenData.expires_in = llData.expires_in || 5184000; // 60 days
            }
          } catch { /* keep short-lived token */ }

          // Fetch the user's ad accounts
          try {
            const acctRes = await fetch(`https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_id,currency,business_name&access_token=${tokenData.access_token}`);
            if (acctRes.ok) {
              const acctData = await acctRes.json();
              tokenData.ad_accounts = acctData.data || [];
            }
          } catch { /* ignore */ }
        }

        // Stripe: extract connected account info
        if (provider === 'stripe') {
          tokenData.stripe_user_id = tokenData.stripe_user_id || null;
          tokenData.stripe_publishable_key = tokenData.stripe_publishable_key || null;
        }

        // Google Ads: store developer token if available
        if (provider === 'google_ads') {
          tokenData.developer_token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || null;
        }

        // Slack: extract bot token and webhook from response
        if (provider === 'slack') {
          tokenData.access_token = tokenData.access_token || tokenData.authed_user?.access_token;
          tokenData.bot_token = tokenData.access_token;
          tokenData.team_name = tokenData.team?.name || null;
          tokenData.team_id = tokenData.team?.id || null;
          if (tokenData.incoming_webhook) {
            tokenData.webhook_url = tokenData.incoming_webhook.url;
            tokenData.webhook_channel = tokenData.incoming_webhook.channel;
          }
        }
      }

      // GHL returns locationId in the token response
      if (provider === 'ghl' && tokenData.locationId) {
        tokenData.location_id = tokenData.locationId;
      }

      // Store the token
      tokenData.companyId = socId;
      await storeToken(provider, socId, tokenData);

      apiLog('info', { api: 'oauth', action: 'callback', provider, societyId: socId, success: true });
      return res.redirect(302, `${baseUrl}/?oauth=success&provider=${provider}&society=${socId}`);
    } catch (e) {
      apiLog('error', { api: 'oauth', action: 'callback', provider }, { error: e.message });
      return res.redirect(302, `${baseUrl}/?oauth=error&provider=${provider}&msg=internal_error`);
    }
  }

  return badRequest(res, 'Unknown action');
}

// --- Exported helpers for other API routes ---

export { getToken, refreshProviderToken, getProviderConfig, getBaseUrl };
