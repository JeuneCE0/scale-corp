// Vercel Serverless Function - TikTok Ads API Proxy
import { applyHeaders, verifyAuth, rateLimit, getClientIP, apiLog, tooManyRequests, badRequest, fetchWithTimeout } from './_middleware.js';
import { handleAdsApiResponse, handleAdsError } from './lib/ads-error-handler.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const TIKTOK_BASE = 'https://business-api.tiktok.com/open_api/v1.3';
const VALID_ACTIONS = ['advertisers', 'campaigns', 'insights'];

async function getTikTokToken(societyId) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/api_tokens?provider=eq.tiktok&society_id=eq.${encodeURIComponent(societyId)}&select=access_token,raw_metadata`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    if (!rows?.[0]) return null;
    let advertiserIds = [];
    try { advertiserIds = JSON.parse(rows[0].raw_metadata || '{}').advertiser_ids || []; } catch {}
    return { accessToken: rows[0].access_token, advertiserIds };
  } catch { return null; }
}

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIP(req);
  if (!rateLimit('tiktok-ads', ip, 20)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) {
    apiLog('warn', { api: 'tiktok-ads', reason: 'unauthed', ip });
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { action, societyId, advertiserId, dateRange } = req.body || {};
  if (!action || !VALID_ACTIONS.includes(action)) return badRequest(res, 'Invalid action');
  if (!societyId) return badRequest(res, 'Missing societyId');

  const tokenData = await getTikTokToken(societyId);
  if (!tokenData?.accessToken) {
    return res.status(500).json({ error: 'TikTok Ads not connected. Connect via OAuth in Settings.' });
  }

  const headers = {
    'Access-Token': tokenData.accessToken,
    'Content-Type': 'application/json',
  };

  try {
    switch (action) {
      case 'advertisers': {
        const appId = process.env.TIKTOK_APP_ID;
        const secret = process.env.TIKTOK_APP_SECRET;
        const ids = tokenData.advertiserIds;
        if (!ids.length) return res.status(200).json({ data: { list: [] } });
        const params = new URLSearchParams({ app_id: appId, secret, advertiser_ids: JSON.stringify(ids) });
        const r = await fetchWithTimeout(`${TIKTOK_BASE}/advertiser/info/?${params}`, { headers });
        if (!r.ok) return handleAdsApiResponse(r, res, 'tiktok-ads');
        return res.status(200).json(await r.json());
      }

      case 'campaigns': {
        const advId = advertiserId || tokenData.advertiserIds?.[0];
        if (!advId) return badRequest(res, 'Missing advertiserId');
        const r = await fetchWithTimeout(`${TIKTOK_BASE}/campaign/get/?advertiser_id=${advId}&page_size=100`, { headers });
        if (!r.ok) return handleAdsApiResponse(r, res, 'tiktok-ads');
        return res.status(200).json(await r.json());
      }

      case 'insights': {
        const advId = advertiserId || tokenData.advertiserIds?.[0];
        if (!advId) return badRequest(res, 'Missing advertiserId');
        const now = new Date();
        const startDate = dateRange?.since || new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
        const endDate = dateRange?.until || now.toISOString().split('T')[0];

        const body = {
          advertiser_id: advId,
          report_type: 'BASIC',
          data_level: 'AUCTION_CAMPAIGN',
          dimensions: ['campaign_id'],
          metrics: ['spend', 'impressions', 'clicks', 'conversion', 'cost_per_conversion', 'conversion_rate', 'cpc', 'cpm', 'ctr', 'reach', 'frequency'],
          start_date: startDate,
          end_date: endDate,
          page_size: 100,
        };

        const r = await fetchWithTimeout(`${TIKTOK_BASE}/report/integrated/get/`, {
          method: 'POST', headers, body: JSON.stringify(body),
        });
        if (!r.ok) return handleAdsApiResponse(r, res, 'tiktok-ads');
        const data = await r.json();

        // Post-process
        const results = (data.data?.list || []).map(row => {
          const m = row.metrics || {};
          const spend = Number(m.spend) || 0;
          return {
            campaignId: row.dimensions?.campaign_id || '',
            spend,
            impressions: Number(m.impressions) || 0,
            clicks: Number(m.clicks) || 0,
            conversions: Number(m.conversion) || 0,
            cpc: Number(m.cpc) || 0,
            cpm: Number(m.cpm) || 0,
            ctr: Number(m.ctr) || 0,
            reach: Number(m.reach) || 0,
            costPerConversion: Number(m.cost_per_conversion) || 0,
          };
        });

        return res.status(200).json({ data: results });
      }

      default:
        return badRequest(res, `Unknown action: ${action}`);
    }
  } catch (e) {
    return handleAdsError(res, 'tiktok-ads', action, e);
  }
}
