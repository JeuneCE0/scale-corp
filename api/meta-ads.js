// Vercel Serverless Function - Meta (Facebook) Ads API Proxy
// Fetches campaign data, ad insights, and performance metrics
import { applyHeaders, verifyAuth, rateLimit, getClientIP, apiLog, tooManyRequests, badRequest } from './_middleware.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';
const VALID_ACTIONS = [
  'ad_accounts', 'campaigns', 'adsets', 'ads',
  'insights', 'campaign_insights', 'account_insights',
];

// Get Meta OAuth token from Supabase api_tokens table
async function getMetaToken(societyId) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/api_tokens?provider=eq.meta&society_id=eq.${encodeURIComponent(societyId)}&select=access_token,expires_at,raw_metadata`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    if (!rows?.[0]) return null;
    const token = rows[0];
    // Check expiration
    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return null; // Meta long-lived tokens can't be refreshed via standard refresh — user must re-auth
    }
    let adAccounts = [];
    try { adAccounts = JSON.parse(token.raw_metadata || '{}').ad_accounts || []; } catch {}
    return { accessToken: token.access_token, adAccounts };
  } catch { return null; }
}

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIP(req);
  if (!rateLimit('meta-ads', ip, 20)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) apiLog('warn', { api: 'meta-ads', reason: 'unauthed', ip });

  const { action, societyId, adAccountId, dateRange, level } = req.body || {};
  if (!action || !VALID_ACTIONS.includes(action)) return badRequest(res, 'Invalid action');
  if (!societyId) return badRequest(res, 'Missing societyId');

  // Resolve token
  const tokenData = await getMetaToken(societyId);
  if (!tokenData?.accessToken) {
    return res.status(500).json({ error: 'Meta Ads not connected. Connect via OAuth in Settings.' });
  }

  const token = tokenData.accessToken;

  try {
    switch (action) {
      case 'ad_accounts': {
        const r = await fetch(`${GRAPH_BASE}/me/adaccounts?fields=id,name,account_id,currency,business_name,account_status,amount_spent,balance&access_token=${token}`);
        if (!r.ok) return handleMetaError(r, res);
        return res.status(200).json(await r.json());
      }

      case 'campaigns': {
        const acctId = adAccountId || tokenData.adAccounts?.[0]?.id;
        if (!acctId) return badRequest(res, 'Missing adAccountId');
        const r = await fetch(`${GRAPH_BASE}/${acctId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time&limit=100&access_token=${token}`);
        if (!r.ok) return handleMetaError(r, res);
        return res.status(200).json(await r.json());
      }

      case 'adsets': {
        const acctId = adAccountId || tokenData.adAccounts?.[0]?.id;
        if (!acctId) return badRequest(res, 'Missing adAccountId');
        const r = await fetch(`${GRAPH_BASE}/${acctId}/adsets?fields=id,name,status,campaign_id,daily_budget,targeting,bid_strategy,optimization_goal&limit=100&access_token=${token}`);
        if (!r.ok) return handleMetaError(r, res);
        return res.status(200).json(await r.json());
      }

      case 'ads': {
        const acctId = adAccountId || tokenData.adAccounts?.[0]?.id;
        if (!acctId) return badRequest(res, 'Missing adAccountId');
        const r = await fetch(`${GRAPH_BASE}/${acctId}/ads?fields=id,name,status,campaign_id,adset_id,creative,created_time&limit=100&access_token=${token}`);
        if (!r.ok) return handleMetaError(r, res);
        return res.status(200).json(await r.json());
      }

      case 'insights':
      case 'campaign_insights':
      case 'account_insights': {
        const acctId = adAccountId || tokenData.adAccounts?.[0]?.id;
        if (!acctId) return badRequest(res, 'Missing adAccountId');

        // Default: last 30 days
        const now = new Date();
        const since = dateRange?.since || new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
        const until = dateRange?.until || now.toISOString().split('T')[0];
        const timeIncrement = dateRange?.increment || 'monthly';
        const insightsLevel = level || (action === 'campaign_insights' ? 'campaign' : 'account');

        const fields = [
          'campaign_name', 'campaign_id', 'adset_name', 'adset_id', 'ad_name', 'ad_id',
          'impressions', 'clicks', 'spend', 'reach', 'frequency',
          'cpc', 'cpm', 'ctr', 'cpp',
          'actions', 'action_values', 'cost_per_action_type',
          'conversions', 'conversion_values', 'cost_per_conversion',
          'date_start', 'date_stop',
        ].join(',');

        const params = new URLSearchParams({
          fields,
          time_range: JSON.stringify({ since, until }),
          time_increment: timeIncrement,
          level: insightsLevel,
          limit: '500',
          access_token: token,
        });

        const r = await fetch(`${GRAPH_BASE}/${acctId}/insights?${params}`);
        if (!r.ok) return handleMetaError(r, res);
        const data = await r.json();

        // Post-process: extract key metrics from actions array
        const processed = (data.data || []).map(row => {
          const actions = row.actions || [];
          const actionValues = row.action_values || [];
          const costPerAction = row.cost_per_action_type || [];

          const leads = actions.find(a => a.action_type === 'lead')?.value || 0;
          const purchases = actions.find(a => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0;
          const pageViews = actions.find(a => a.action_type === 'landing_page_view')?.value || 0;
          const linkClicks = actions.find(a => a.action_type === 'link_click')?.value || 0;
          const revenue = actionValues.find(a => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0;
          const costPerLead = costPerAction.find(a => a.action_type === 'lead')?.value || 0;

          return {
            ...row,
            _leads: Number(leads),
            _purchases: Number(purchases),
            _pageViews: Number(pageViews),
            _linkClicks: Number(linkClicks),
            _revenue: Number(revenue),
            _costPerLead: Number(costPerLead),
            _spend: Number(row.spend || 0),
            _impressions: Number(row.impressions || 0),
            _clicks: Number(row.clicks || 0),
            _reach: Number(row.reach || 0),
            _cpc: Number(row.cpc || 0),
            _cpm: Number(row.cpm || 0),
            _ctr: Number(row.ctr || 0),
            _roas: Number(row.spend) > 0 ? Number(revenue) / Number(row.spend) : 0,
          };
        });

        return res.status(200).json({ data: processed, paging: data.paging });
      }

      default:
        return badRequest(res, `Unknown action: ${action}`);
    }
  } catch (e) {
    apiLog('error', { api: 'meta-ads', action }, { error: e.message });
    return res.status(500).json({ error: 'Internal proxy error' });
  }
}

async function handleMetaError(r, res) {
  const text = await r.text();
  apiLog('error', { api: 'meta-ads' }, { status: r.status, error: text.slice(0, 200) });
  let msg = `Meta API error: ${r.status}`;
  try { const j = JSON.parse(text); msg = j.error?.message || msg; } catch {}
  return res.status(r.status).json({ error: msg });
}
