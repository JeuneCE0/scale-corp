// HubScale — GDPR API (Vercel Serverless Function)
// Handles data export and account deletion requests

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.VITE_APP_URL || 'https://hubscale.app';

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

async function verifyAuth(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const sb = getSupabaseAdmin();
  const { data: { user }, error } = await sb.auth.getUser(auth.slice(7));
  if (error || !user) return null;
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  return profile;
}

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

async function handleExport(res, profile) {
  const sb = getSupabaseAdmin();
  const orgId = profile.org_id;

  // Collect all user/org data
  const [contacts, finances, events, integrations, prefs] = await Promise.all([
    sb.from('contacts').select('*').eq('org_id', orgId),
    sb.from('financial_history').select('*').eq('org_id', orgId),
    sb.from('events').select('*').eq('org_id', orgId),
    sb.from('integrations').select('name, connected, last_synced_at, created_at').eq('org_id', orgId),
    sb.from('user_preferences').select('*').eq('user_id', profile.id),
  ]);

  const { data: org } = await sb.from('organizations').select('*').eq('id', orgId).single();

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: profile.role,
      created_at: profile.created_at,
    },
    organization: org,
    contacts: contacts.data || [],
    financial_history: finances.data || [],
    events: events.data || [],
    integrations: integrations.data || [],
    preferences: prefs.data?.[0] || null,
  };

  // Log audit
  await sb.from('audit_log').insert({
    org_id: orgId,
    user_id: profile.id,
    action: 'gdpr_data_export',
    entity_type: 'user',
    entity_id: profile.id,
  });

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
