// Vercel Serverless Function - Google Ads API Proxy
// Fetches campaign data, ad insights, and performance metrics via Google Ads REST API
import { applyHeaders, verifyAuth, rateLimit, getClientIP, apiLog, tooManyRequests, badRequest, fetchWithTimeout } from './_middleware.js';
import { refreshToken } from './lib/token-refresh.js';
import { handleAdsApiResponse, handleAdsError } from './lib/ads-error-handler.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

const GADS_BASE = 'https://googleads.googleapis.com/v17';
const VALID_ACTIONS = ['customers', 'campaigns', 'insights', 'campaign_insights'];

// Get Google Ads OAuth token from Supabase api_tokens table
async function getGoogleAdsToken(societyId) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/api_tokens?provider=eq.google_ads&society_id=eq.${encodeURIComponent(societyId)}&select=access_token,expires_at,refresh_token`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    if (!rows?.[0]) return null;
    const token = rows[0];
    // Refresh if expired
    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return await refreshGoogleToken(token, societyId);
    }
    return token.access_token;
  } catch { return null; }
}

async function refreshGoogleToken(stored, societyId) {
  const result = await refreshToken({
    provider: 'google_ads',
    stored: { ...stored, society_id: societyId },
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_ADS_CLIENT_ID,
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  });
  return result?.access_token || null;
}

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIP(req);
  if (!rateLimit('google-ads', ip, 20)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) {
    apiLog('warn', { api: 'google-ads', reason: 'unauthed', ip });
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { action, societyId, customerId, dateRange } = req.body || {};
  if (!action || !VALID_ACTIONS.includes(action)) return badRequest(res, 'Invalid action');
  if (!societyId) return badRequest(res, 'Missing societyId');

  // Validate customerId format (must be numeric) to prevent path injection
  if (customerId && !/^\d+$/.test(customerId)) {
    return badRequest(res, 'Invalid customerId format');
  }

  const token = await getGoogleAdsToken(societyId);
  if (!token) {
    return res.status(500).json({ error: 'Google Ads not connected. Connect via OAuth in Settings.' });
  }

  if (!GOOGLE_ADS_DEVELOPER_TOKEN) {
    return res.status(500).json({ error: 'Google Ads developer token not configured.' });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
    'Content-Type': 'application/json',
  };

  try {
    switch (action) {
      case 'customers': {
        // List accessible customer accounts
        const r = await fetchWithTimeout(`${GADS_BASE}/customers:listAccessibleCustomers`, { headers });
        if (!r.ok) return handleAdsApiResponse(r, res, 'google-ads');
        return res.status(200).json(await r.json());
      }

      case 'campaigns': {
        if (!customerId) return badRequest(res, 'Missing customerId');
        const query = `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.start_date, campaign.end_date FROM campaign WHERE campaign.status != 'REMOVED' ORDER BY campaign.name`;
        const r = await fetchWithTimeout(`${GADS_BASE}/customers/${customerId}/googleAds:searchStream`, {
          method: 'POST', headers, body: JSON.stringify({ query }),
        });
        if (!r.ok) return handleAdsApiResponse(r, res, 'google-ads');
        return res.status(200).json(await r.json());
      }

      case 'insights':
      case 'campaign_insights': {
        if (!customerId) return badRequest(res, 'Missing customerId');
        const now = new Date();
        const since = dateRange?.since || new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0].replace(/-/g, '');
        const until = dateRange?.until || now.toISOString().split('T')[0].replace(/-/g, '');

        // Format dates for Google Ads (YYYY-MM-DD) with validation
        const sinceFormatted = since.length === 8 ? `${since.slice(0,4)}-${since.slice(4,6)}-${since.slice(6,8)}` : since;
        const untilFormatted = until.length === 8 ? `${until.slice(0,4)}-${until.slice(4,6)}-${until.slice(6,8)}` : until;

        // Validate date format to prevent GAQL injection (strict YYYY-MM-DD)
        const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
        if (!DATE_RE.test(sinceFormatted) || !DATE_RE.test(untilFormatted)) {
          return badRequest(res, 'Invalid date format');
        }

        // Ensure since <= until
        if (sinceFormatted > untilFormatted) {
          return badRequest(res, 'since date must be before or equal to until date');
        }

        const segmentBy = action === 'campaign_insights' ? 'campaign.name, campaign.id,' : '';
        const query = `SELECT ${segmentBy} metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc, metrics.average_cpm, segments.date FROM campaign WHERE segments.date BETWEEN '${sinceFormatted}' AND '${untilFormatted}' AND campaign.status != 'REMOVED' ORDER BY segments.date`;

        const r = await fetchWithTimeout(`${GADS_BASE}/customers/${customerId}/googleAds:searchStream`, {
          method: 'POST', headers, body: JSON.stringify({ query }),
        });
        if (!r.ok) return handleAdsApiResponse(r, res, 'google-ads');
        const raw = await r.json();

        // Post-process: flatten and compute derived metrics
        const results = (raw[0]?.results || []).map(row => {
          const m = row.metrics || {};
          const spend = (Number(m.costMicros) || 0) / 1e6;
          const revenue = Number(m.conversionsValue) || 0;
          return {
            campaign: row.campaign?.name || '',
            campaignId: row.campaign?.id || '',
            date: row.segments?.date || '',
            impressions: Number(m.impressions) || 0,
            clicks: Number(m.clicks) || 0,
            spend: Math.round(spend * 100) / 100,
            conversions: Number(m.conversions) || 0,
            revenue: Math.round(revenue * 100) / 100,
            ctr: Number(m.ctr) || 0,
            cpc: (Number(m.averageCpc) || 0) / 1e6,
            cpm: (Number(m.averageCpm) || 0) / 1e6,
            roas: spend > 0 ? Math.round(revenue / spend * 100) / 100 : 0,
          };
        });

        return res.status(200).json({ data: results });
      }

      default:
        return badRequest(res, `Unknown action: ${action}`);
    }
  } catch (e) {
    return handleAdsError(res, 'google-ads', action, e);
  }
}
