import { fetchWithTimeout } from '../_middleware.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

/**
 * Generic OAuth token refresh and Supabase storage update.
 * @param {Object} options
 * @param {string} options.provider - Provider name (ghl, google, revolut, etc.)
 * @param {Object} options.stored - Stored token object from Supabase
 * @param {string} options.tokenUrl - Token endpoint URL
 * @param {string} options.clientId
 * @param {string} options.clientSecret
 * @param {Object} [options.extraBody] - Extra body params for specific providers
 * @param {string} [options.contentType='application/x-www-form-urlencoded']
 * @returns {Promise<Object|null>} Refreshed token data or null on failure
 */
export async function refreshToken({ provider, stored, tokenUrl, clientId, clientSecret, extraBody = {}, contentType = 'application/x-www-form-urlencoded' }) {
  if (!stored?.refresh_token || !clientId || !clientSecret) return null;

  try {
    const body = {
      grant_type: 'refresh_token',
      refresh_token: stored.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
      ...extraBody,
    };

    const fetchOpts = { method: 'POST' };
    if (contentType === 'application/json') {
      fetchOpts.headers = { 'Content-Type': 'application/json' };
      fetchOpts.body = JSON.stringify(body);
    } else {
      fetchOpts.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      fetchOpts.body = new URLSearchParams(body).toString();
    }

    const r = await fetchWithTimeout(tokenUrl, fetchOpts);
    if (!r.ok) return null;

    const tokenData = await r.json();
    const newAccessToken = tokenData.access_token;
    if (!newAccessToken) return null;

    // Update in Supabase
    const updateBody = {
      access_token: newAccessToken,
      refresh_token: tokenData.refresh_token || stored.refresh_token,
      updated_at: new Date().toISOString(),
      raw_metadata: JSON.stringify(tokenData),
    };
    if (tokenData.expires_in) {
      updateBody.expires_at = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    }

    await fetch(`${SUPABASE_URL}/rest/v1/api_tokens?society_id=eq.${stored.society_id}&provider=eq.${provider}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify(updateBody),
    });

    return { ...stored, ...updateBody };
  } catch {
    return null;
  }
}
