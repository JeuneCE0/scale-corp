// HubScale — API Client (talks to /api/ serverless functions)

function authHeaders() {
  const token = localStorage.getItem('hs_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

/** Generic API call */
async function apiCall(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

// --- Auth ---
export async function login(email, password) {
  return apiCall('/api/auth?action=login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(email, password, name, tenantId) {
  return apiCall('/api/auth?action=signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, tenant_id: tenantId }),
  });
}

export async function getMe() {
  return apiCall('/api/auth?action=me');
}

export async function logout() {
  return apiCall('/api/auth?action=logout', { method: 'POST' });
}

// --- Supabase Data ---
export async function sbGet(table, filters = {}) {
  const params = new URLSearchParams({ action: 'get', table });
  if (Object.keys(filters).length) params.set('filters', JSON.stringify(filters));
  return apiCall(`/api/supabase?${params}`);
}

export async function sbList(table, tenantId) {
  const params = new URLSearchParams({ action: 'list', table });
  if (tenantId) params.set('tenant_id', tenantId);
  return apiCall(`/api/supabase?${params}`);
}

export async function sbUpsert(table, data) {
  return apiCall('/api/supabase?action=upsert', {
    method: 'POST',
    body: JSON.stringify({ table, data }),
  });
}

export async function sbDelete(table, id) {
  return apiCall(`/api/supabase?action=delete&table=${table}&id=${id}`, {
    method: 'DELETE',
  });
}

// --- GHL ---
export async function ghlCall(action, locationId, params = {}) {
  return apiCall('/api/ghl', {
    method: 'POST',
    body: JSON.stringify({ action, locationId, ...params }),
  });
}

// --- Revolut ---
export async function revolutCall(action, company) {
  return apiCall('/api/revolut', {
    method: 'POST',
    body: JSON.stringify({ action, company }),
  });
}

// --- Stripe ---
export async function stripeCall(action, params = {}) {
  return apiCall('/api/stripe', {
    method: 'POST',
    body: JSON.stringify({ action, ...params }),
  });
}

// --- Billing ---
export async function createCheckout(planId) {
  return apiCall('/api/billing', {
    method: 'POST',
    body: JSON.stringify({ action: 'create_checkout', planId }),
  });
}

export async function getSubscription() {
  return apiCall('/api/billing?action=subscription');
}
