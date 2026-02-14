import { readFileSync, writeFileSync, existsSync } from 'fs';

const EVENTS_FILE = '/tmp/ghl-events.json';
const MAX_EVENTS = 100;
const VALID_EVENTS = ['ContactCreate', 'ContactUpdate', 'OpportunityStatusUpdate', 'AppointmentScheduled'];

function readEvents() {
  try {
    if (existsSync(EVENTS_FILE)) return JSON.parse(readFileSync(EVENTS_FILE, 'utf8'));
  } catch {}
  return [];
}

function writeEvents(events) {
  writeFileSync(EVENTS_FILE, JSON.stringify(events.slice(-MAX_EVENTS)), 'utf8');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-webhook-secret'];
  if (!secret || secret !== process.env.GHL_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body || {};
  const eventType = body.type || body.event || body.eventType || 'unknown';

  const event = {
    type: eventType,
    data: body,
    receivedAt: new Date().toISOString(),
    valid: VALID_EVENTS.includes(eventType),
  };

  const events = readEvents();
  events.push(event);
  writeEvents(events);

  return res.status(200).json({ ok: true });
}
