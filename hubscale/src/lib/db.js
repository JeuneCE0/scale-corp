// HubScale — Database Service Layer
// Progressive enhancement: uses Supabase when configured, falls back to localStorage.
// Every function returns the same shape regardless of backend.

import { getSupabase, isSupabaseConfigured } from './supabase.js';
import { store, load, storeDebounced, remove } from './store.js';

// ─── Helpers ───

function orgId() {
  const sb = getSupabase();
  if (!sb) return null;
  // Cached after first fetch in the session
  if (orgId._cache) return orgId._cache;
  return null;
}

/** Set org_id cache (called once after login) */
export function setOrgId(id) {
  orgId._cache = id;
  store('_orgId', id);
}

/** Restore org_id from cache on init */
export function restoreOrgId() {
  orgId._cache = load('_orgId');
  return orgId._cache;
}

// ─── Contacts ───

export async function listContacts() {
  const sb = getSupabase();
  if (sb && orgId()) {
    const { data, error } = await sb
      .from('contacts')
      .select('*, contact_comments(id, content, created_at, author_id)')
      .eq('org_id', orgId())
      .order('created_at', { ascending: false });
    if (!error && data) {
      // Normalize for frontend compatibility
      const contacts = data.map(normalizeContact);
      store('contacts', contacts); // cache locally
      return contacts;
    }
  }
  return load('contacts') || [];
}

export async function upsertContact(contact) {
  const sb = getSupabase();
  if (sb && orgId()) {
    const row = toContactRow(contact);
    row.org_id = orgId();
    const { data, error } = await sb.from('contacts').upsert(row, { onConflict: 'id' }).select().single();
    if (!error && data) {
      const result = normalizeContact(data);
      // Update local cache
      const cached = load('contacts') || [];
      const idx = cached.findIndex((c) => c.id === result.id);
      if (idx >= 0) cached[idx] = result; else cached.unshift(result);
      store('contacts', cached);
      return result;
    }
  }
  // Fallback: localStorage only
  const contacts = load('contacts') || [];
  if (!contact.id) contact.id = crypto.randomUUID();
  if (!contact.createdAt) contact.createdAt = new Date().toISOString();
  const idx = contacts.findIndex((c) => c.id === contact.id);
  if (idx >= 0) contacts[idx] = { ...contacts[idx], ...contact };
  else contacts.unshift(contact);
  store('contacts', contacts);
  return contact;
}

export async function deleteContact(id) {
  const sb = getSupabase();
  if (sb && orgId()) {
    await sb.from('contacts').delete().eq('id', id).eq('org_id', orgId());
  }
  const contacts = (load('contacts') || []).filter((c) => c.id !== id);
  store('contacts', contacts);
}

export async function addContactComment(contactId, content) {
  const sb = getSupabase();
  if (sb && orgId()) {
    const session = await sb.auth.getSession();
    const userId = session?.data?.session?.user?.id || null;
    const { data, error } = await sb.from('contact_comments').insert({
      contact_id: contactId, org_id: orgId(), author_id: userId, content,
    }).select().single();
    if (!error) return { id: data.id, text: content, date: data.created_at };
  }
  return { id: crypto.randomUUID(), text: content, date: new Date().toISOString() };
}

// ─── Financial History ───

export async function listFinancialHistory() {
  const sb = getSupabase();
  if (sb && orgId()) {
    const { data, error } = await sb
      .from('financial_history')
      .select('*')
      .eq('org_id', orgId())
      .order('period_key', { ascending: true });
    if (!error && data) {
      const history = data.map(normalizeFinance);
      store('finHistory', history);
      return history;
    }
  }
  return load('finHistory') || [];
}

export async function upsertFinancialMonth(entry) {
  const sb = getSupabase();
  if (sb && orgId()) {
    const { error } = await sb.from('financial_history').upsert({
      org_id: orgId(),
      period_key: entry.key,
      ca: entry.ca || 0,
      charges: entry.charges || 0,
      marge: entry.marge || 0,
      treso: entry.treso || 0,
    }, { onConflict: 'org_id,period_key' });
    if (error) console.warn('[db] upsertFinancialMonth error:', error.message);
  }
  // Always update local cache
  const history = load('finHistory') || [];
  const idx = history.findIndex((h) => h.key === entry.key);
  if (idx >= 0) history[idx] = { ...history[idx], ...entry };
  else history.push(entry);
  history.sort((a, b) => a.key.localeCompare(b.key));
  store('finHistory', history);
  return entry;
}

export async function deleteFinancialMonth(key) {
  const sb = getSupabase();
  if (sb && orgId()) {
    await sb.from('financial_history').delete().eq('org_id', orgId()).eq('period_key', key);
  }
  const history = (load('finHistory') || []).filter((h) => h.key !== key);
  store('finHistory', history);
}

// ─── Events ───

export async function listEvents() {
  const sb = getSupabase();
  if (sb && orgId()) {
    const { data, error } = await sb
      .from('events')
      .select('*')
      .eq('org_id', orgId())
      .order('date', { ascending: true });
    if (!error && data) {
      const events = data.map(normalizeEvent);
      store('events', events);
      return events;
    }
  }
  return load('events') || [];
}

export async function upsertEvent(event) {
  const sb = getSupabase();
  if (sb && orgId()) {
    const row = toEventRow(event);
    row.org_id = orgId();
    const { data, error } = await sb.from('events').upsert(row, { onConflict: 'id' }).select().single();
    if (!error && data) {
      const result = normalizeEvent(data);
      const cached = load('events') || [];
      const idx = cached.findIndex((e) => e.id === result.id);
      if (idx >= 0) cached[idx] = result; else cached.push(result);
      store('events', cached);
      return result;
    }
  }
  // Fallback
  const events = load('events') || [];
  if (!event.id) event.id = crypto.randomUUID();
  const idx = events.findIndex((e) => e.id === event.id);
  if (idx >= 0) events[idx] = { ...events[idx], ...event };
  else events.push(event);
  store('events', events);
  return event;
}

export async function deleteEvent(id) {
  const sb = getSupabase();
  if (sb && orgId()) {
    await sb.from('events').delete().eq('id', id).eq('org_id', orgId());
  }
  const events = (load('events') || []).filter((e) => e.id !== id);
  store('events', events);
}

// ─── Integrations State ───

export async function listIntegrations() {
  const sb = getSupabase();
  if (sb && orgId()) {
    const { data, error } = await sb
      .from('integrations')
      .select('*')
      .eq('org_id', orgId());
    if (!error && data) {
      const map = {};
      data.forEach((row) => { map[row.name] = row.connected; });
      store('integrations', map);
      return map;
    }
  }
  return load('integrations') || {};
}

export async function setIntegrationConnected(name, connected) {
  const sb = getSupabase();
  if (sb && orgId()) {
    await sb.from('integrations').upsert({
      org_id: orgId(), name, connected, last_synced_at: connected ? new Date().toISOString() : null,
    }, { onConflict: 'org_id,name' });
    // Log sync history
    await sb.from('sync_history').insert({
      org_id: orgId(), integration_name: name, action: connected ? 'connect' : 'disconnect',
    });
  }
  const map = load('integrations') || {};
  map[name] = connected;
  store('integrations', map);
}

// ─── Synced Integration Data (ad_insights, deals, bank_accounts, transactions) ───

export async function listAdInsights() {
  const sb = getSupabase();
  if (sb && orgId()) {
    const { data, error } = await sb
      .from('ad_insights')
      .select('*')
      .eq('org_id', orgId())
      .order('date', { ascending: false });
    if (!error && data) {
      store('adInsights', data);
      return data;
    }
  }
  return load('adInsights') || [];
}

export async function listDeals() {
  const sb = getSupabase();
  if (sb && orgId()) {
    const { data, error } = await sb
      .from('deals')
      .select('*')
      .eq('org_id', orgId())
      .order('created_at', { ascending: false });
    if (!error && data) {
      store('deals', data);
      return data;
    }
  }
  return load('deals') || [];
}

export async function listTransactions() {
  const sb = getSupabase();
  if (sb && orgId()) {
    const { data, error } = await sb
      .from('transactions')
      .select('*')
      .eq('org_id', orgId())
      .order('date', { ascending: false });
    if (!error && data) {
      store('transactions', data);
      return data;
    }
  }
  return load('transactions') || [];
}

export async function listBankAccounts() {
  const sb = getSupabase();
  if (sb && orgId()) {
    const { data, error } = await sb
      .from('bank_accounts')
      .select('*')
      .eq('org_id', orgId());
    if (!error && data) {
      store('bankAccounts', data);
      return data;
    }
  }
  return load('bankAccounts') || [];
}

/**
 * Pull ALL synced data from Supabase into localStorage.
 * Call this after an integration sync to ensure the UI has fresh data.
 */
export async function fetchAllSyncedData() {
  if (!isSupabaseConfigured() || !orgId()) return;
  const [, , , , adInsights, , transactions] = await Promise.all([
    listContacts(),
    listFinancialHistory(),
    listEvents(),
    listIntegrations(),
    listAdInsights(),
    listDeals(),
    listTransactions(),
    listBankAccounts(),
  ]);

  // Compute aggregated ad metrics for pages that read 'metaAds'
  if (adInsights && adInsights.length > 0) {
    const totalSpend = adInsights.reduce((s, r) => s + (r.spend || 0), 0);
    const totalImpressions = adInsights.reduce((s, r) => s + (r.impressions || 0), 0);
    const totalClicks = adInsights.reduce((s, r) => s + (r.clicks || 0), 0);
    const totalConversions = adInsights.reduce((s, r) => s + (r.conversions || 0), 0);
    const totalRevenue = adInsights.reduce((s, r) => s + (r.revenue || 0), 0);
    store('metaAds', {
      spend: Math.round(totalSpend * 100) / 100,
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
      cpa: totalConversions > 0 ? Math.round((totalSpend / totalConversions) * 100) / 100 : 0,
      roas: totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0,
    });
  }

  // Update finHistory from transaction data if available
  if (transactions && transactions.length > 0) {
    const existing = load('finHistory') || [];
    const monthMap = {};
    existing.forEach((r) => { monthMap[r.key] = { ...r }; });
    transactions.forEach((tx) => {
      const d = tx.date || tx.created_at;
      if (!d) return;
      const key = d.slice(0, 7); // YYYY-MM
      if (!monthMap[key]) monthMap[key] = { key, ca: 0, charges: 0, marge: 0, treso: 0 };
      const amount = Number(tx.amount) || 0;
      if (amount > 0) monthMap[key].ca += amount;
      else monthMap[key].charges += Math.abs(amount);
    });
    Object.values(monthMap).forEach((r) => {
      r.marge = r.ca - r.charges;
      r.result = r.marge;
    });
    const updated = Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key));
    store('finHistory', updated);
  }
}

// ─── User Preferences ───

export async function loadPreferences() {
  const sb = getSupabase();
  if (sb) {
    const session = await sb.auth.getSession();
    const uid = session?.data?.session?.user?.id;
    if (uid) {
      const { data } = await sb.from('user_preferences').select('*').eq('user_id', uid).single();
      if (data) return data;
    }
  }
  return {
    theme: load('theme') || 'dark',
    lang: load('lang') || 'fr',
    onboarded: load('onboarded') || false,
    tour_done: load('tourDone') || false,
    widget_order: load('widgetOrder') || [],
  };
}

export async function savePreference(key, value) {
  const sb = getSupabase();
  if (sb) {
    const session = await sb.auth.getSession();
    const uid = session?.data?.session?.user?.id;
    if (uid) {
      await sb.from('user_preferences').upsert(
        { user_id: uid, [key]: value },
        { onConflict: 'user_id' }
      );
    }
  }
  store(key, value);
}

// ─── Organizations ───

export async function getOrganization() {
  const sb = getSupabase();
  if (sb && orgId()) {
    const { data } = await sb.from('organizations').select('*').eq('id', orgId()).single();
    if (data) {
      store('organization', data);
      return data;
    }
  }
  return load('organization') || null;
}

export async function updateOrganization(updates) {
  const sb = getSupabase();
  if (sb && orgId()) {
    const { data, error } = await sb.from('organizations').update(updates).eq('id', orgId()).select().single();
    if (!error && data) {
      store('organization', data);
      return data;
    }
  }
  const org = load('organization') || {};
  const updated = { ...org, ...updates };
  store('organization', updated);
  return updated;
}

// ─── Audit Log ───

export async function logAudit(action, entityType, entityId, details) {
  const sb = getSupabase();
  if (sb && orgId()) {
    const session = await sb.auth.getSession();
    await sb.from('audit_log').insert({
      org_id: orgId(),
      user_id: session?.data?.session?.user?.id || null,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      details: details || {},
    });
  }
}

// ─── Normalization helpers ───

function normalizeContact(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    status: row.status,
    leadScore: row.lead_score,
    source: row.source,
    ca: Number(row.ca),
    notes: row.notes,
    tags: row.tags || [],
    lastContactAt: row.last_contact_at,
    createdAt: row.created_at,
    commentaires: (row.contact_comments || []).map((c) => ({
      id: c.id,
      text: c.content,
      date: c.created_at,
    })),
  };
}

function toContactRow(c) {
  const row = {};
  if (c.id) row.id = c.id;
  if (c.name !== undefined) row.name = c.name;
  if (c.email !== undefined) row.email = c.email;
  if (c.phone !== undefined) row.phone = c.phone;
  if (c.company !== undefined) row.company = c.company;
  if (c.status !== undefined) row.status = c.status;
  if (c.leadScore !== undefined) row.lead_score = c.leadScore;
  if (c.source !== undefined) row.source = c.source;
  if (c.ca !== undefined) row.ca = c.ca;
  if (c.notes !== undefined) row.notes = c.notes;
  if (c.tags !== undefined) row.tags = c.tags;
  if (c.lastContactAt !== undefined) row.last_contact_at = c.lastContactAt;
  return row;
}

function normalizeFinance(row) {
  return {
    key: row.period_key,
    ca: Number(row.ca),
    charges: Number(row.charges),
    marge: Number(row.marge),
    treso: Number(row.treso),
  };
}

function normalizeEvent(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    time: row.time,
    endTime: row.end_time,
    type: row.type,
    source: row.source,
    externalId: row.external_id,
  };
}

function toEventRow(e) {
  const row = {};
  if (e.id) row.id = e.id;
  if (e.title !== undefined) row.title = e.title;
  if (e.description !== undefined) row.description = e.description;
  if (e.date !== undefined) row.date = e.date;
  if (e.time !== undefined) row.time = e.time;
  if (e.endTime !== undefined) row.end_time = e.endTime;
  if (e.type !== undefined) row.type = e.type;
  if (e.source !== undefined) row.source = e.source;
  if (e.externalId !== undefined) row.external_id = e.externalId;
  return row;
}
