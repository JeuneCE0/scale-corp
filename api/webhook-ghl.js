// GHL Webhook receiver — stores events via global variable (persists per instance)
// For cross-instance persistence, logs to console (Vercel logs)

let recentEvents = globalThis.__ghlEvents || [];
globalThis.__ghlEvents = recentEvents;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET = read recent events
  if (req.method === 'GET') {
    return res.status(200).json({ events: recentEvents, count: recentEvents.length });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-webhook-secret'];
  if (!secret || secret !== process.env.GHL_WEBHOOK_SECRET) {
    console.log('GHL Webhook: Unauthorized attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body || {};
  
  const event = {
    type: body.type || body.event || body.workflow?.name || 'unknown',
    contactId: body.contact_id || body.contactId || body.id,
    contactName: body.contact_name || body.contactName || body.full_name || body.name || body.first_name,
    contactEmail: body.email || body.contact_email,
    phone: body.phone || body.contact_phone,
    locationId: body.location_id || body.locationId,
    data: body,
    receivedAt: new Date().toISOString(),
  };

  // Store in memory (same instance only)
  recentEvents.unshift(event);
  if (recentEvents.length > 50) recentEvents = recentEvents.slice(0, 50);
  globalThis.__ghlEvents = recentEvents;

  // Log to Vercel logs (always accessible)
  console.log('GHL_WEBHOOK_EVENT:', JSON.stringify(event));

  return res.status(200).json({ ok: true, event: event.type });
}
