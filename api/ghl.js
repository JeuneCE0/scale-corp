// Vercel Serverless Function - GHL API v2 Proxy
import { readFileSync, existsSync } from 'fs';
import { applyHeaders, verifyAuth, canAccessGHLLocation, rateLimit, getClientIP, apiLog, tooManyRequests, badRequest } from './_middleware.js';

const LOCATION_KEY_MAP = {
  "NsV7HI2MbE6qHtRp410y": "GHL_ECO_KEY",
  "BjQ4DxmWrLl3nCNcjmhE": "GHL_LEADX_KEY",
  "2lB0paK192CFU1cLz5eT": "GHL_BCS_KEY",
  "nTgok0v3cxvVLOLXyR11": "GHL_MODERMA_KEY",
};

const GHL_BASE = "https://services.leadconnectorhq.com";
const VALID_ACTIONS = ['contacts', 'pipelines', 'opportunities', 'contacts_list', 'opportunities_all', 'calendars', 'conversations', 'contact_update', 'contact_create', 'contact_delete', 'calendar_events', 'conversations_list', 'conversations_messages', 'conversation_send', 'calendar_slots', 'notes_list', 'notes_create', 'webhook_events'];

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = getClientIP(req);
  if (!rateLimit('ghl', ip)) return tooManyRequests(res);

  const { action, locationId, ...params } = req.body || {};
  if (!action || !VALID_ACTIONS.includes(action)) return badRequest(res, "Invalid action");

  // Auth check
  const auth = await verifyAuth(req);
  if (!auth) {
    apiLog('warn', { api: 'ghl', action, reason: 'unauthed', ip });
  } else if (locationId && !canAccessGHLLocation(auth, locationId)) {
    return res.status(403).json({ error: "Access denied to this location" });
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

  const envVar = LOCATION_KEY_MAP[locationId];
  if (!envVar) return res.status(403).json({ error: "Invalid locationId" });

  const apiKey = process.env[envVar];
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

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
          if (!pRes.ok) { const t = await pRes.text(); return res.status(pRes.status).json({ error: t }); }
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
        if (!updRes.ok) { const t = await updRes.text(); return res.status(updRes.status).json({ error: t }); }
        return res.status(200).json(await updRes.json());
      }
      case "contact_create": {
        const createData = { ...(params.data || {}), locationId };
        const crRes = await fetch(`${GHL_BASE}/contacts/`, {
          method: "POST", headers, body: JSON.stringify(createData)
        });
        if (!crRes.ok) { const t = await crRes.text(); return res.status(crRes.status).json({ error: t }); }
        return res.status(200).json(await crRes.json());
      }
      case "contact_delete": {
        if (!params.contactId) return badRequest(res, "Missing contactId");
        const delRes = await fetch(`${GHL_BASE}/contacts/${encodeURIComponent(params.contactId)}`, {
          method: "DELETE", headers
        });
        if (!delRes.ok) { const t = await delRes.text(); return res.status(delRes.status).json({ error: t }); }
        return res.status(200).json({ success: true });
      }
      case "calendar_events": {
        const st = params.startTime || (Date.now() - 365 * 24 * 60 * 60 * 1000);
        const et = params.endTime || Date.now();
        if (!params.calendarId) {
          // Fetch all calendars then events in parallel (fixes N+1)
          const calRes = await fetch(`${GHL_BASE}/calendars/?locationId=${locationId}`, { headers });
          if (!calRes.ok) return res.status(calRes.status).json({ error: "Failed to fetch calendars" });
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
        if (!evRes.ok) { const t = await evRes.text(); return res.status(evRes.status).json({ error: t }); }
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
        if (!sendRes.ok) { const t = await sendRes.text(); return res.status(sendRes.status).json({ error: t }); }
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
        if (!noteRes.ok) { const t = await noteRes.text(); return res.status(noteRes.status).json({ error: t }); }
        return res.status(200).json(await noteRes.json());
      }
      default:
        return badRequest(res, `Unknown action: ${action}`);
    }

    const ghlRes = await fetch(url, { headers });
    if (!ghlRes.ok) {
      const text = await ghlRes.text();
      apiLog('error', { api: 'ghl', action }, { status: ghlRes.status });
      return res.status(ghlRes.status).json({ error: `GHL API error: ${ghlRes.status}` });
    }

    return res.status(200).json(await ghlRes.json());
  } catch (e) {
    apiLog('error', { api: 'ghl', action }, { error: e.message });
    return res.status(500).json({ error: "Internal proxy error" });
  }
}
