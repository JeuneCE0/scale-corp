// HubScale — Export API (Vercel Serverless Function)
// Handles data export in CSV and JSON formats

import { getSupabaseAdmin } from './utils/supabase.js';
import { verifyAuth } from './utils/auth.js';

const APP_URL = process.env.VITE_APP_URL || 'https://hubscale.app';

async function safeQuery(promise) {
  try {
    const result = await promise;
    return result.data || [];
  } catch {
    return [];
  }
}

// ─── CSV Helper ───

function escapeCsvField(value) {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(escapeCsvField).join(',');
  const lines = rows.map((row) =>
    headers.map((h) => escapeCsvField(row[h])).join(','),
  );
  return [headerLine, ...lines].join('\n');
}

// ─── Data Fetchers ───

async function fetchContacts(sb, orgId) {
  return safeQuery(sb.from('contacts').select('*').eq('org_id', orgId));
}

async function fetchFinances(sb, orgId) {
  return safeQuery(sb.from('financial_history').select('*').eq('org_id', orgId));
}

async function fetchEvents(sb, orgId) {
  return safeQuery(sb.from('events').select('*').eq('org_id', orgId));
}

// ─── Main Handler ───

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', APP_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const profile = await verifyAuth(req);
    if (!profile) return res.status(401).json({ error: 'Non autorisé' });

    const { format, scope } = req.body;

    // Validate format
    const validFormats = ['csv', 'json'];
    if (!format || !validFormats.includes(format)) {
      return res.status(400).json({ error: 'Format invalide. Utilisez "csv" ou "json".' });
    }

    // Validate scope
    const validScopes = ['contacts', 'finances', 'events', 'all'];
    if (!scope || !validScopes.includes(scope)) {
      return res.status(400).json({ error: 'Scope invalide. Utilisez "contacts", "finances", "events" ou "all".' });
    }

    const sb = getSupabaseAdmin();
    const orgId = profile.org_id;

    // Fetch requested data
    const data = {};

    if (scope === 'contacts' || scope === 'all') {
      data.contacts = await fetchContacts(sb, orgId);
    }
    if (scope === 'finances' || scope === 'all') {
      data.finances = await fetchFinances(sb, orgId);
    }
    if (scope === 'events' || scope === 'all') {
      data.events = await fetchEvents(sb, orgId);
    }

    // Audit log
    await sb.from('audit_log').insert({
      org_id: orgId,
      user_id: profile.id,
      action: 'data_export',
      entity_type: 'export',
      details: { format, scope },
    }).catch(() => {});

    // JSON format
    if (format === 'json') {
      return res.status(200).json({
        exported_at: new Date().toISOString(),
        scope,
        ...data,
      });
    }

    // CSV format
    if (scope === 'all') {
      // For scope 'all' with CSV: return JSON with individual CSV strings per scope
      return res.status(200).json({
        exported_at: new Date().toISOString(),
        scope,
        contacts_csv: toCsv(data.contacts),
        finances_csv: toCsv(data.finances),
        events_csv: toCsv(data.events),
      });
    }

    // Single scope CSV — return as text/csv
    const rows = data[scope] || [];
    const csv = toCsv(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${scope}_export.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    console.error('[export]', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
