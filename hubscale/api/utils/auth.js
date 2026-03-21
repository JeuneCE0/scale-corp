// HubScale — Shared Auth Verification
import { getSupabaseAdmin } from './supabase.js';

export async function verifyAuth(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const sb = getSupabaseAdmin();
  const { data: { user }, error } = await sb.auth.getUser(auth.slice(7));
  if (error || !user) return null;
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  return profile;
}
