// HubScale — Admin API Client
// Handles calls to /api/admin for super-admin panel
// Falls back to localStorage mock data when Supabase is not configured

import { getAuthToken } from './auth.js';
import { isSupabaseConfigured } from './supabase.js';
import { load, store } from './store.js';

const API_BASE = '/api';

async function adminHeaders() {
  const token = await getAuthToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

async function adminCall(path, options = {}) {
  const headers = await adminHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  if (res.status === 403) throw new Error('Acces refuse — droits admin requis');
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Demo/Mock data for localStorage fallback ───

const PLAN_MONTHLY = { starter: 49, professional: 149, enterprise: 349 };

function seedDemoOrgs() {
  const existing = load('_admin_orgs');
  if (existing && existing.length > 0) return existing;

  const orgs = [
    { id: 'org_1', name: 'TechFlow SAS', sector: 'tech', plan: 'professional', created_at: '2025-08-15T10:00:00Z', stripe_customer_id: 'cus_demo1' },
    { id: 'org_2', name: 'E-Shop Pro', sector: 'ecommerce', plan: 'enterprise', created_at: '2025-06-01T10:00:00Z', stripe_customer_id: 'cus_demo2' },
    { id: 'org_3', name: 'ConsultX', sector: 'consulting', plan: 'starter', created_at: '2025-10-20T10:00:00Z', stripe_customer_id: null },
    { id: 'org_4', name: 'HealthPlus', sector: 'sante', plan: 'professional', created_at: '2025-09-10T10:00:00Z', stripe_customer_id: 'cus_demo4' },
    { id: 'org_5', name: 'ImmoVest', sector: 'immobilier', plan: 'starter', created_at: '2025-11-05T10:00:00Z', stripe_customer_id: null },
    { id: 'org_6', name: 'ServicePro', sector: 'services', plan: 'professional', created_at: '2025-07-22T10:00:00Z', stripe_customer_id: 'cus_demo6' },
    { id: 'org_7', name: 'IndustrieTech', sector: 'industrie', plan: 'enterprise', created_at: '2025-05-10T10:00:00Z', stripe_customer_id: 'cus_demo7' },
    { id: 'org_8', name: 'StartupLab', sector: 'tech', plan: 'starter', created_at: '2026-01-15T10:00:00Z', stripe_customer_id: null },
  ];
  store('_admin_orgs', orgs);
  return orgs;
}

function seedDemoUsers() {
  const existing = load('_admin_users');
  if (existing && existing.length > 0) return existing;

  const users = [
    { id: 'u1', full_name: 'Marie Dupont', email: 'marie@techflow.fr', role: 'owner', org_id: 'org_1', created_at: '2025-08-15T10:00:00Z' },
    { id: 'u2', full_name: 'Pierre Martin', email: 'pierre@techflow.fr', role: 'member', org_id: 'org_1', created_at: '2025-09-01T10:00:00Z' },
    { id: 'u3', full_name: 'Sophie Bernard', email: 'sophie@eshoppro.com', role: 'owner', org_id: 'org_2', created_at: '2025-06-01T10:00:00Z' },
    { id: 'u4', full_name: 'Jean Lefevre', email: 'jean@consultx.fr', role: 'owner', org_id: 'org_3', created_at: '2025-10-20T10:00:00Z' },
    { id: 'u5', full_name: 'Claire Moreau', email: 'claire@healthplus.fr', role: 'owner', org_id: 'org_4', created_at: '2025-09-10T10:00:00Z' },
    { id: 'u6', full_name: 'Lucas Petit', email: 'lucas@healthplus.fr', role: 'admin', org_id: 'org_4', created_at: '2025-09-15T10:00:00Z' },
    { id: 'u7', full_name: 'Emma Roux', email: 'emma@immovest.fr', role: 'owner', org_id: 'org_5', created_at: '2025-11-05T10:00:00Z' },
    { id: 'u8', full_name: 'Thomas Girard', email: 'thomas@servicepro.fr', role: 'owner', org_id: 'org_6', created_at: '2025-07-22T10:00:00Z' },
    { id: 'u9', full_name: 'Julie Lambert', email: 'julie@industrietech.fr', role: 'owner', org_id: 'org_7', created_at: '2025-05-10T10:00:00Z' },
    { id: 'u10', full_name: 'Nicolas Dubois', email: 'nicolas@startuplab.io', role: 'owner', org_id: 'org_8', created_at: '2026-01-15T10:00:00Z' },
  ];
  store('_admin_users', users);
  return users;
}

function demoStats() {
  const orgs = seedDemoOrgs();
  const users = seedDemoUsers();
  const planDist = { starter: 0, professional: 0, enterprise: 0 };
  let mrr = 0;
  orgs.forEach((o) => {
    planDist[o.plan]++;
    mrr += PLAN_MONTHLY[o.plan] || 0;
  });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const newThisMonth = orgs.filter((o) => o.created_at >= monthStart).length;
  return {
    totalOrgs: orgs.length,
    totalUsers: users.length,
    mrr,
    arr: mrr * 12,
    planDistribution: planDist,
    newThisMonth,
    arpu: Math.round(mrr / orgs.length),
  };
}

function demoRevenueHistory() {
  const orgs = seedDemoOrgs();
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const active = orgs.filter((o) => o.created_at <= d.toISOString());
    const mrr = active.reduce((s, o) => s + (PLAN_MONTHLY[o.plan] || 0), 0);
    months.push({ month: key, mrr, orgCount: active.length });
  }
  return {
    months,
    organizations: orgs.map((o) => ({
      id: o.id, name: o.name, plan: o.plan,
      monthlyRevenue: PLAN_MONTHLY[o.plan] || 0,
      hasStripe: !!o.stripe_customer_id, createdAt: o.created_at,
    })),
  };
}

// ─── Public API ───

export async function checkAdminStatus() {
  if (!isSupabaseConfigured()) return { ok: true, role: 'super_admin' };
  return adminCall('/admin?action=check_admin');
}

export async function getPlatformStats() {
  if (!isSupabaseConfigured()) return demoStats();
  return adminCall('/admin?action=platform_stats');
}

export async function listOrganizations({ page = 1, limit = 20, search = '', plan = '' } = {}) {
  if (!isSupabaseConfigured()) {
    const orgs = seedDemoOrgs();
    const users = seedDemoUsers();
    let filtered = orgs;
    if (search) filtered = filtered.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));
    if (plan && plan !== 'all') filtered = filtered.filter((o) => o.plan === plan);
    return {
      organizations: filtered.map((o) => ({
        ...o,
        memberCount: users.filter((u) => u.org_id === o.id).length,
        contactCount: Math.floor(Math.random() * 50) + 5,
        monthlyRevenue: PLAN_MONTHLY[o.plan] || 0,
      })),
      total: filtered.length, page, limit,
    };
  }
  const params = new URLSearchParams({ action: 'list_organizations', page, limit, search, plan });
  return adminCall(`/admin?${params}`);
}

export async function getOrganization(orgId) {
  if (!isSupabaseConfigured()) {
    const orgs = seedDemoOrgs();
    const users = seedDemoUsers();
    const org = orgs.find((o) => o.id === orgId);
    if (!org) throw new Error('Organisation introuvable');
    return {
      ...org,
      monthlyRevenue: PLAN_MONTHLY[org.plan] || 0,
      members: users.filter((u) => u.org_id === orgId),
      contactCount: Math.floor(Math.random() * 50) + 5,
      financialHistory: [],
      integrations: [],
    };
  }
  return adminCall(`/admin?action=get_organization&org_id=${orgId}`);
}

export async function updateOrganization(orgId, updates) {
  if (!isSupabaseConfigured()) {
    const orgs = seedDemoOrgs();
    const idx = orgs.findIndex((o) => o.id === orgId);
    if (idx >= 0) { Object.assign(orgs[idx], updates); store('_admin_orgs', orgs); }
    return { ok: true };
  }
  return adminCall('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'update_organization', org_id: orgId, ...updates }),
  });
}

export async function listUsers({ page = 1, limit = 20, search = '' } = {}) {
  if (!isSupabaseConfigured()) {
    const users = seedDemoUsers();
    const orgs = seedDemoOrgs();
    const orgMap = {};
    orgs.forEach((o) => { orgMap[o.id] = o; });
    let filtered = users;
    if (search) filtered = filtered.filter((u) => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
    return {
      users: filtered.map((u) => ({ ...u, orgName: orgMap[u.org_id]?.name || '-', orgPlan: orgMap[u.org_id]?.plan || 'starter' })),
      total: filtered.length, page, limit,
    };
  }
  const params = new URLSearchParams({ action: 'list_users', page, limit, search });
  return adminCall(`/admin?${params}`);
}

export async function updateUser(userId, updates) {
  if (!isSupabaseConfigured()) {
    const users = seedDemoUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) { Object.assign(users[idx], updates); store('_admin_users', users); }
    return { ok: true };
  }
  return adminCall('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'update_user', user_id: userId, ...updates }),
  });
}

export async function resetUserPassword(userId) {
  if (!isSupabaseConfigured()) return { ok: true, message: 'Email de reset envoye (demo)' };
  return adminCall('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'reset_password', user_id: userId }),
  });
}

export async function changeOrgPlan(orgId, plan) {
  if (!isSupabaseConfigured()) {
    const orgs = seedDemoOrgs();
    const idx = orgs.findIndex((o) => o.id === orgId);
    if (idx >= 0) { orgs[idx].plan = plan; store('_admin_orgs', orgs); }
    return { ok: true, from: orgs[idx]?.plan, to: plan };
  }
  return adminCall('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'change_plan', org_id: orgId, plan }),
  });
}

export async function getRevenueHistory() {
  if (!isSupabaseConfigured()) return demoRevenueHistory();
  return adminCall('/admin?action=revenue_history');
}

export async function getAdminAuditLog({ page = 1, limit = 50 } = {}) {
  if (!isSupabaseConfigured()) return { entries: [], total: 0, page, limit };
  const params = new URLSearchParams({ action: 'audit_log', page, limit });
  return adminCall(`/admin?${params}`);
}

export async function clearUserData(email) {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Supabase non configuré' };
  return adminCall('/admin', {
    method: 'POST',
    body: JSON.stringify({ action: 'clear_user_data', email }),
  });
}
