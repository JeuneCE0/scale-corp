// HubScale — GDPR API (Vercel Serverless Function)
// Handles data export and account deletion requests

import { getSupabaseAdmin } from './utils/supabase.js';
import { verifyAuth } from './utils/auth.js';

const APP_URL = process.env.VITE_APP_URL || 'https://hubscale.app';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', APP_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const profile = await verifyAuth(req);
    if (!profile) return res.status(401).json({ error: 'Non autorisé' });

    const { action } = req.body;

    if (action === 'export') {
      return handleExport(res, profile);
    } else if (action === 'delete') {
      return handleDeletion(res, profile);
    }

    return res.status(400).json({ error: 'Action invalide' });
  } catch (err) {
    console.error('[gdpr]', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function safeQuery(promise) {
  try {
    const result = await promise;
    return result.data || [];
  } catch {
    return [];
  }
}

async function safeQuerySingle(promise) {
  try {
    const result = await promise;
    return result.data || null;
  } catch {
    return null;
  }
}

async function handleExport(res, profile) {
  const sb = getSupabaseAdmin();
  const orgId = profile.org_id;

  // Collect all user/org data with graceful error handling per table
  const [
    profileData,
    org,
    contacts,
    finances,
    events,
    invoices,
    integrations,
    prefs,
    settings,
  ] = await Promise.all([
    safeQuerySingle(sb.from('profiles').select('*').eq('id', profile.id).single()),
    safeQuerySingle(sb.from('organizations').select('*').eq('id', orgId).single()),
    safeQuery(sb.from('contacts').select('*').eq('org_id', orgId)),
    safeQuery(sb.from('financial_history').select('*').eq('org_id', orgId)),
    safeQuery(sb.from('events').select('*').eq('org_id', orgId)),
    safeQuery(sb.from('invoices').select('*').eq('org_id', orgId)),
    safeQuery(sb.from('integrations').select('name, connected, last_synced_at, created_at').eq('org_id', orgId)),
    safeQuery(sb.from('user_preferences').select('*').eq('user_id', profile.id)),
    safeQuery(sb.from('settings').select('*').eq('user_id', profile.id)),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profileData || {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: profile.role,
      created_at: profile.created_at,
    },
    organization: org,
    contacts,
    financial_history: finances,
    events,
    invoices,
    integrations,
    preferences: prefs.length > 0 ? prefs[0] : null,
    settings: settings.length > 0 ? settings[0] : null,
  };

  // Log audit
  await sb.from('audit_log').insert({
    org_id: orgId,
    user_id: profile.id,
    action: 'gdpr_data_export',
    entity_type: 'user',
    entity_id: profile.id,
  }).catch(() => {});

  return res.status(200).json(exportData);
}

async function handleDeletion(res, profile) {
  const sb = getSupabaseAdmin();
  const orgId = profile.org_id;

  // Check if user is the owner
  if (profile.role !== 'owner') {
    return res.status(403).json({
      error: 'Seul le propriétaire du compte peut demander la suppression',
    });
  }

  // Check if there are other members
  const { count } = await sb.from('profiles').select('id', { count: 'exact', head: true }).eq('org_id', orgId);

  if (count > 1) {
    return res.status(400).json({
      error: 'Veuillez d\'abord retirer les autres membres de l\'organisation',
    });
  }

  // Delete all org data (cascading through foreign keys)
  await sb.from('organizations').delete().eq('id', orgId);

  // Delete auth user
  await sb.auth.admin.deleteUser(profile.id);

  return res.status(200).json({ ok: true, message: 'Compte et données supprimés' });
}
