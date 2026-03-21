// HubScale — Notifications API (Vercel Serverless Function)
// Handles listing, marking read, and deleting notifications

import { getSupabaseAdmin } from './utils/supabase.js';
import { verifyAuth } from './utils/auth.js';
import { cors, unauthorized, badRequest, methodNotAllowed, serverError } from './utils/errors.js';

const PAGE_SIZE = 20;

export default async function handler(req, res) {
  cors(res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const profile = await verifyAuth(req);
    if (!profile) return unauthorized(res);

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
        if (!id) return badRequest(res, 'ID requis');

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
        if (!id) return badRequest(res, 'ID requis');

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

      return badRequest(res, 'Action invalide');
    }

    return methodNotAllowed(res);
  } catch {
    return serverError(res);
  }
}
