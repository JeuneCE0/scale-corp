// HubScale — API Client
// Handles calls to Vercel serverless functions for sensitive operations
// (Stripe billing, OAuth token exchange, etc.)

import { getAuthToken } from './auth.js';

const API_BASE = '/api';

async function authHeaders() {
  const token = await getAuthToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

async function apiCall(path, options = {}) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Billing (Stripe) ───

export async function createCheckoutSession(planId) {
  return apiCall('/billing', {
    method: 'POST',
    body: JSON.stringify({ action: 'create_checkout', planId }),
  });
}

export async function getSubscription() {
  return apiCall('/billing?action=subscription');
}

export async function createBillingPortalSession() {
  return apiCall('/billing', {
    method: 'POST',
    body: JSON.stringify({ action: 'portal' }),
  });
}

// ─── Integration OAuth ───

export async function startOAuthFlow(integrationName) {
  return apiCall('/integrations/oauth', {
    method: 'POST',
    body: JSON.stringify({ action: 'start', integration: integrationName }),
  });
}

export async function completeOAuthFlow(integrationName, code) {
  return apiCall('/integrations/oauth', {
    method: 'POST',
    body: JSON.stringify({ action: 'callback', integration: integrationName, code }),
  });
}

export async function disconnectIntegration(integrationName) {
  return apiCall('/integrations/oauth', {
    method: 'POST',
    body: JSON.stringify({ action: 'disconnect', integration: integrationName }),
  });
}

export async function connectWithApiKey(integrationName, apiKey, apiUrl) {
  return apiCall('/integrations/oauth', {
    method: 'POST',
    body: JSON.stringify({ action: 'connect_with_key', integration: integrationName, apiKey, apiUrl }),
  });
}

// ─── Integration Sync ───

export async function syncIntegration(integrationName) {
  return apiCall('/integrations/sync', {
    method: 'POST',
    body: JSON.stringify({ integration: integrationName }),
  });
}

// ─── Data Export ───

export async function requestExport(format, scope) {
  return apiCall('/export', {
    method: 'POST',
    body: JSON.stringify({ format, scope }),
  });
}

// ─── GDPR ───

export async function requestDataExport() {
  return apiCall('/gdpr', {
    method: 'POST',
    body: JSON.stringify({ action: 'export' }),
  });
}

export async function requestAccountDeletion() {
  return apiCall('/gdpr', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete' }),
  });
}

// ─── Notifications ───

export async function listNotifications(page = 1) {
  return apiCall(`/notifications?page=${page}`);
}

export async function markNotificationRead(id) {
  return apiCall('/notifications', {
    method: 'POST',
    body: JSON.stringify({ action: 'mark_read', id }),
  });
}

export async function markAllNotificationsRead() {
  return apiCall('/notifications', {
    method: 'POST',
    body: JSON.stringify({ action: 'mark_all_read' }),
  });
}

export async function deleteNotification(id) {
  return apiCall('/notifications', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', id }),
  });
}

// ─── Affiliate ───

export async function getAffiliateDashboard() {
  return apiCall('/affiliate?action=dashboard');
}

export async function registerAffiliateSlug(slug, orgId) {
  return apiCall('/affiliate?action=register-slug', {
    method: 'POST',
    body: JSON.stringify({ slug, org_id: orgId }),
  });
}

export async function requestAffiliatePayout(amount, bankInfo) {
  return apiCall('/affiliate?action=request-payout', {
    method: 'POST',
    body: JSON.stringify({ amount, bank_info: bankInfo }),
  });
}

export async function saveAffiliateBankInfo(bankInfo) {
  return apiCall('/affiliate?action=save-bank-info', {
    method: 'POST',
    body: JSON.stringify({ bank_info: bankInfo }),
  });
}
