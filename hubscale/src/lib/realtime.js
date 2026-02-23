// HubScale — Supabase Realtime Subscription Manager
// Manages real-time Postgres change subscriptions filtered by organisation.

import { getSupabase, isSupabaseConfigured } from './supabase.js';

/**
 * Active subscriptions keyed by a unique label (table:orgId).
 * Each value is the Supabase RealtimeChannel instance.
 * @type {Map<string, import('@supabase/supabase-js').RealtimeChannel>}
 */
const subscriptions = new Map();

/**
 * Subscribe to INSERT, UPDATE and DELETE changes on a table, scoped to an
 * organisation via the `org_id` column.
 *
 * If Supabase is not configured the call is a silent no-op so that the app
 * can run in local / demo mode without errors.
 *
 * @param {string} table   — Postgres table name (e.g. 'contacts')
 * @param {string} orgId   — Organisation UUID used to filter rows
 * @param {(payload: object) => void} callback — Invoked with the Realtime
 *   change payload ({ eventType, new, old, … })
 * @returns {() => void} Unsubscribe function (also a no-op when not configured)
 *
 * @example
 *   const unsub = subscribeToTable('contacts', orgId, (payload) => {
 *     console.log(payload.eventType, payload.new);
 *   });
 *   // later…
 *   unsub();
 */
export function subscribeToTable(table, orgId, callback) {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const supabase = getSupabase();
  if (!supabase) {
    return () => {};
  }

  const label = `${table}:${orgId}`;

  // If there is already an active subscription for this table+org, remove it
  // before creating a new one to avoid duplicates.
  if (subscriptions.has(label)) {
    supabase.removeChannel(subscriptions.get(label));
    subscriptions.delete(label);
  }

  const channel = supabase
    .channel(label)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table,
        filter: `org_id=eq.${orgId}`,
      },
      callback,
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table,
        filter: `org_id=eq.${orgId}`,
      },
      callback,
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table,
        filter: `org_id=eq.${orgId}`,
      },
      callback,
    )
    .subscribe();

  subscriptions.set(label, channel);

  // Return a convenience unsubscribe function for this specific subscription.
  return () => {
    if (subscriptions.has(label)) {
      supabase.removeChannel(subscriptions.get(label));
      subscriptions.delete(label);
    }
  };
}

/**
 * Remove every active Realtime subscription.
 * Useful on logout or when the user switches organisation.
 */
export function unsubscribeAll() {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return;
  }

  for (const [label, channel] of subscriptions) {
    supabase.removeChannel(channel);
  }

  subscriptions.clear();
}
