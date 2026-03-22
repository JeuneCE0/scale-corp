const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

export function getSupabaseUrl() {
  return SUPABASE_URL;
}

export function sbHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    Prefer: 'return=representation',
    ...extra,
  };
}
