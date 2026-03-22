// HubScale — Supabase Client Configuration
// Replace these with your actual Supabase project values (or use env vars)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let _warnedMissing = false;

// Singleton client — only created if credentials are configured
let _client = null;

export function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (!_warnedMissing) {
      console.warn('[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not configured — using local auth fallback');
      _warnedMissing = true;
    }
    return null;
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storageKey: 'hs_supabase_auth',
        detectSessionInUrl: true,
      },
      // Throttle realtime events to 2/sec to reduce bandwidth on mobile.
      // Increase to 10 if realtime updates feel sluggish.
      realtime: { params: { eventsPerSecond: 2 } },
    });
  }
  return _client;
}

/**
 * Check if Supabase is configured and available.
 * When false, the app falls back to localStorage-only mode (demo/dev).
 */
export function isSupabaseConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
