// HubScale — Notifications API (Vercel Serverless Function)
// Handles listing, marking read, and deleting notifications

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.VITE_APP_URL || 'https://hubscale.app';

const PAGE_SIZE = 20;

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

async function verifyAuth(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);

  const sb = getSupabaseAdmin();
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  return profile;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', APP_URL);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const profile = await verifyAuth(req);
    if (!profile) return res.status(401).json({ error: 'Non autorisé' });

    const sb = getSupabaseAdmin();

    // GET — List notifications (paginated)
    if (req.method === 'GET') {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Count total
      const { count } = await sb
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', profile.org_id)
        .or(`user_id.eq.${profile.id},user_id.is.null`);

      const total = count || 0;
      const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

      // Fetch page
      const { data: notifications, error } = await sb
        .from('notifications')
        .select('*')
        .eq('org_id', profile.org_id)
        .or(`user_id.eq.${profile.id},user_id.is.null`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('[notifications] list error:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération' });
      }

      return res.status(200).json({ notifications: notifications || [], total, page, totalPages });
    }

    // POST — Actions
    if (req.method === 'POST') {
      // Parse body if not already parsed
      if (!req.body) {
        try {
          const chunks = [];
          await new Promise((resolve, reject) => {
            req.on('data', (chunk) => chunks.push(chunk));
            req.on('end', resolve);
            req.on('error', reject);
          });
          req.body = JSON.parse(Buffer.concat(chunks).toString());
        } catch { req.body = {}; }
      }

      const { action, id } = req.body;

      if (action === 'mark_read') {
        if (!id) return res.status(400).json({ error: 'ID requis' });

        const { error } = await sb
          .from('notifications')
          .update({ read: true })
          .eq('id', id)
          .eq('org_id', profile.org_id);

        if (error) {
          console.error('[notifications] mark_read error:', error);
          return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
        }

        return res.status(200).json({ success: true });
      }

      if (action === 'mark_all_read') {
        const { error } = await sb
          .from('notifications')
          .update({ read: true })
          .eq('org_id', profile.org_id)
          .eq('read', false);

        if (error) {
          console.error('[notifications] mark_all_read error:', error);
          return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
        }

        return res.status(200).json({ success: true });
      }

      if (action === 'delete') {
        if (!id) return res.status(400).json({ error: 'ID requis' });

        const { error } = await sb
          .from('notifications')
          .delete()
          .eq('id', id)
          .eq('org_id', profile.org_id);

        if (error) {
          console.error('[notifications] delete error:', error);
          return res.status(500).json({ error: 'Erreur lors de la suppression' });
        }

        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Action invalide' });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (err) {
    console.error('[notifications]', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
