// Vercel Serverless Function - GHL API v2 Proxy
import { readFileSync, existsSync } from 'fs';
import { applyHeaders, verifyAuth, canAccessGHLLocation, rateLimit, getClientIP, apiLog, tooManyRequests, badRequest, fetchWithTimeout } from './_middleware.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const LOCATION_KEY_MAP = JSON.parse(process.env.GHL_LOCATION_MAP || '{}');

// Try to get OAuth token from Supabase api_tokens table
async function getOAuthToken(locationId) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/api_tokens?provider=eq.ghl&location_id=eq.${encodeURIComponent(locationId)}&select=access_token,expires_at,refresh_token,society_id`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    if (!rows?.[0]) return null;
    const token = rows[0];
    // Check expiration — refresh if needed
    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return await refreshOAuthToken(token);
    }
    return token.access_token;
  } catch { return null; }
}

async function refreshOAuthToken(stored) {
  if (!stored.refresh_token) return null;
  const clientId = process.env.GHL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GHL_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  try {
    const r = await fetchWithTimeout('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: stored.refresh_token, client_id: clientId, client_secret: clientSecret }).toString(),
    });
    if (!r.ok) return null;
    const data = await r.json();
    // Store updated token
    const payload = {
      id: `ghl_${stored.society_id}`,
      access_token: data.access_token,
      refresh_token: data.refresh_token || stored.refresh_token,
      expires_at: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    await fetch(`${SUPABASE_URL}/rest/v1/api_tokens`, {
      method: 'POST',
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify([payload]),
    }).catch(() => {});
    return data.access_token;
  } catch { return null; }
}

const GHL_BASE = "https://services.leadconnectorhq.com";
const VALID_ACTIONS = ['contacts', 'pipelines', 'opportunities', 'contacts_list', 'opportunities_all', 'calendars', 'conversations', 'contact_update', 'contact_create', 'contact_delete', 'calendar_events', 'conversations_list', 'conversations_messages', 'conversation_send', 'calendar_slots', 'notes_list', 'notes_create', 'webhook_events', 'invoice_create', 'invoice_send'];

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const ip = getClientIP(req);
  if (!rateLimit('ghl', ip)) return tooManyRequests(res);

  const { action, locationId, ...params } = req.body || {};
  if (!action || !VALID_ACTIONS.includes(action)) return badRequest(res, "Invalid action");

  // Auth check
  const auth = await verifyAuth(req);
  if (!auth) {
    apiLog('warn', { api: 'ghl', action, reason: 'unauthed', ip });
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }
  if (locationId && !canAccessGHLLocation(auth, locationId)) {
    return res.status(403).json({ ok: false, error: "Access denied to this location" });
  }

  // webhook_events doesn't need locationId
  if (action === "webhook_events") {
    try {
      const evFile = '/tmp/ghl-events.json';
      const events = existsSync(evFile) ? JSON.parse(readFileSync(evFile, 'utf8')) : [];
      return res.status(200).json({ events });
    } catch { return res.status(200).json({ events: [] }); }
  }

  if (!locationId) return badRequest(res, "Missing locationId");

  // Resolve API key: env var first, then OAuth token from Supabase
  const envVar = LOCATION_KEY_MAP[locationId];
  let apiKey = envVar ? process.env[envVar] : null;
  if (!apiKey) {
    apiKey = await getOAuthToken(locationId);
  }
  if (!apiKey) return res.status(500).json({ ok: false, error: "API key not configured. Connect via OAuth or set environment variable." });

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };

  let url;
  try {
    switch (action) {
      case "contacts":
        url = `${GHL_BASE}/contacts/?locationId=${locationId}&limit=1`;
        break;
      case "pipelines":
        url = `${GHL_BASE}/opportunities/pipelines?locationId=${locationId}`;
        break;
      case "opportunities":
        if (!params.pipeline_id) return badRequest(res, "Missing pipeline_id");
        url = `${GHL_BASE}/opportunities/search?location_id=${locationId}&pipeline_id=${encodeURIComponent(params.pipeline_id)}&limit=100`;
        break;
      case "contacts_list": {
        // Paginated fetch with configurable max pages
        const maxPages = Math.min(parseInt(params.maxPages) || 20, 50);
        let allContacts = [];
        let startAfter = null;
        let startAfterId = null;
        let page = 0;
        do {
          let pUrl = `${GHL_BASE}/contacts/?locationId=${locationId}&limit=100`;
          if (startAfterId) pUrl += `&startAfter=${startAfter}&startAfterId=${startAfterId}`;
          const pRes = await fetch(pUrl, { headers });
          if (!pRes.ok) { const t = await pRes.text(); return res.status(pRes.status).json({ ok: false, error: t }); }
          const pData = await pRes.json();
          const batch = pData.contacts || [];
          allContacts = allContacts.concat(batch);
          startAfterId = pData.meta?.startAfterId || null;
          startAfter = pData.meta?.startAfter || null;
          page++;
        } while (startAfterId && page < maxPages);
        return res.status(200).json({ contacts: allContacts, meta: { total: allContacts.length, pages: page } });
      }
      case "opportunities_all":
        if (!params.pipeline_id) return badRequest(res, "Missing pipeline_id");
        url = `${GHL_BASE}/opportunities/search?location_id=${locationId}&pipeline_id=${encodeURIComponent(params.pipeline_id)}&limit=100&status=all`;
        break;
      case "calendars":
        url = `${GHL_BASE}/calendars/?locationId=${locationId}`;
        break;
      case "conversations":
        url = `${GHL_BASE}/conversations/search?locationId=${locationId}&limit=20`;
        break;
      case "contact_update": {
        if (!params.contactId) return badRequest(res, "Missing contactId");
        const updRes = await fetch(`${GHL_BASE}/contacts/${encodeURIComponent(params.contactId)}`, {
          method: "PUT", headers, body: JSON.stringify(params.data || {})
        });
        if (!updRes.ok) { const t = await updRes.text(); return res.status(updRes.status).json({ ok: false, error: t }); }
        return res.status(200).json(await updRes.json());
      }
      case "contact_create": {
        const createData = { ...(params.data || {}), locationId };
        const crRes = await fetch(`${GHL_BASE}/contacts/`, {
          method: "POST", headers, body: JSON.stringify(createData)
        });
        if (!crRes.ok) { const t = await crRes.text(); return res.status(crRes.status).json({ ok: false, error: t }); }
        return res.status(200).json(await crRes.json());
      }
      case "contact_delete": {
        if (!params.contactId) return badRequest(res, "Missing contactId");
        const delRes = await fetch(`${GHL_BASE}/contacts/${encodeURIComponent(params.contactId)}`, {
          method: "DELETE", headers
        });
        if (!delRes.ok) { const t = await delRes.text(); return res.status(delRes.status).json({ ok: false, error: t }); }
        return res.status(200).json({ ok: true });
      }
      case "calendar_events": {
        const st = params.startTime || (Date.now() - 365 * 24 * 60 * 60 * 1000);
        const et = params.endTime || Date.now();
        if (!params.calendarId) {
          // Fetch all calendars then events in parallel (fixes N+1)
          const calRes = await fetch(`${GHL_BASE}/calendars/?locationId=${locationId}`, { headers });
          if (!calRes.ok) return res.status(calRes.status).json({ ok: false, error: "Failed to fetch calendars" });
          const calData = await calRes.json();
          const calendars = calData.calendars || [];
          const results = await Promise.allSettled(
            calendars.map(cal =>
              fetch(`${GHL_BASE}/calendars/events?locationId=${locationId}&calendarId=${cal.id}&startTime=${st}&endTime=${et}`, { headers })
                .then(r => r.ok ? r.json() : { events: [] })
                .then(d => (d.events || []).map(e => ({ ...e, calendarName: cal.name })))
            )
          );
          const allEvents = results.filter(r => r.status === 'fulfilled').flatMap(r => r.value);
          return res.status(200).json({ events: allEvents, total: allEvents.length });
        }
        const evRes = await fetch(`${GHL_BASE}/calendars/events?locationId=${locationId}&calendarId=${encodeURIComponent(params.calendarId)}&startTime=${st}&endTime=${et}`, { headers });
        if (!evRes.ok) { const t = await evRes.text(); return res.status(evRes.status).json({ ok: false, error: t }); }
        return res.status(200).json(await evRes.json());
      }
      case "conversations_list":
        url = `${GHL_BASE}/conversations/search?locationId=${locationId}&limit=50&sortBy=last_message_date&sortOrder=desc`;
        break;
      case "conversations_messages": {
        if (!params.conversationId) return badRequest(res, "Missing conversationId");
        url = `${GHL_BASE}/conversations/${encodeURIComponent(params.conversationId)}/messages`;
        break;
      }
      case "conversation_send": {
        if (!params.contactId || !params.message) return badRequest(res, "Missing contactId or message");
        const sendRes = await fetch(`${GHL_BASE}/conversations/messages`, {
          method: "POST", headers, body: JSON.stringify({ type: params.type || "SMS", contactId: params.contactId, message: params.message })
        });
        if (!sendRes.ok) { const t = await sendRes.text(); return res.status(sendRes.status).json({ ok: false, error: t }); }
        return res.status(200).json(await sendRes.json());
      }
      case "calendar_slots": {
        if (!params.calendarId) return badRequest(res, "Missing calendarId");
        let slotsUrl = `${GHL_BASE}/calendars/${encodeURIComponent(params.calendarId)}/free-slots?`;
        if (params.startDate) slotsUrl += `startDate=${encodeURIComponent(params.startDate)}&`;
        if (params.endDate) slotsUrl += `endDate=${encodeURIComponent(params.endDate)}&`;
        url = slotsUrl.replace(/[&?]$/, '');
        break;
      }
      case "notes_list": {
        if (!params.contactId) return badRequest(res, "Missing contactId");
        url = `${GHL_BASE}/contacts/${encodeURIComponent(params.contactId)}/notes`;
        break;
      }
      case "notes_create": {
        if (!params.contactId) return badRequest(res, "Missing contactId");
        const noteRes = await fetch(`${GHL_BASE}/contacts/${encodeURIComponent(params.contactId)}/notes`, {
          method: "POST", headers, body: JSON.stringify(params.data || {})
        });
        if (!noteRes.ok) { const t = await noteRes.text(); return res.status(noteRes.status).json({ ok: false, error: t }); }
        return res.status(200).json(await noteRes.json());
      }
      case "invoice_create": {
        if (!params.invoiceData) return badRequest(res, "Missing invoiceData");
        const invRes = await fetch(`${GHL_BASE}/invoices/`, {
          method: "POST", headers, body: JSON.stringify(params.invoiceData)
        });
        if (!invRes.ok) { const t = await invRes.text(); return res.status(invRes.status).json({ ok: false, error: t }); }
        return res.status(200).json(await invRes.json());
      }
      case "invoice_send": {
        if (!params.invoiceId) return badRequest(res, "Missing invoiceId");
        const sendInvRes = await fetch(`${GHL_BASE}/invoices/${encodeURIComponent(params.invoiceId)}/send`, {
          method: "POST", headers
        });
        if (!sendInvRes.ok) { const t = await sendInvRes.text(); return res.status(sendInvRes.status).json({ ok: false, error: t }); }
        return res.status(200).json(await sendInvRes.json());
      }
      default:
        return badRequest(res, `Unknown action: ${action}`);
    }

    const ghlRes = await fetch(url, { headers });
    if (!ghlRes.ok) {
      const text = await ghlRes.text();
      apiLog('error', { api: 'ghl', action }, { status: ghlRes.status });
      return res.status(ghlRes.status).json({ ok: false, error: `GHL API error: ${ghlRes.status}` });
    }

    return res.status(200).json(await ghlRes.json());
  } catch (e) {
    apiLog('error', { api: 'ghl', action }, { error: e.message });
    return res.status(500).json({ ok: false, error: "Internal proxy error" });
  }
}
