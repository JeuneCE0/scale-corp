// HubScale — Admin API (Vercel Serverless Function)
// Super-admin panel endpoints for cross-org management

import { getSupabaseAdmin } from './utils/supabase.js';
import { cors, forbidden, badRequest, notFound, serverError } from './utils/errors.js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const PLAN_MONTHLY = { starter: 49, professional: 149, enterprise: 349 };

function validateString(val, maxLen = 255) {
  if (typeof val !== 'string') return false;
  if (val.length > maxLen) return false;
  return true;
}

// Sanitize search input for ilike queries — escape Postgres wildcards
function sanitizeSearch(val) {
  if (typeof val !== 'string') return '';
  return val.replace(/[%_\\]/g, (c) => '\\' + c).slice(0, 100);
}
const VALID_ROLES = ['owner', 'admin', 'member', 'viewer'];
const VALID_PLANS = ['starter', 'professional', 'enterprise'];

const PLAN_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

async function getStripe() {
  const Stripe = (await import('stripe')).default;
  return new Stripe(STRIPE_SECRET_KEY);
}

async function verifyAdmin(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);

  const sb = getSupabaseAdmin();
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'super_admin') return null;

  return { ...profile, authUser: user };
}

async function logAdminAction(sb, adminId, action, targetType, targetId, details) {
  await sb.from('admin_audit_log').insert({
    admin_user_id: adminId,
    action,
    target_type: targetType || null,
    target_id: targetId || null,
    details: details || {},
  }).catch(() => {});
}

export default async function handler(req, res) {
  cors(res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const admin = await verifyAdmin(req);
    if (!admin) return forbidden(res, 'Acces refuse — droits super_admin requis');

    const action = req.method === 'GET'
      ? req.query.action
      : (req.body?.action || req.query.action);

    const sb = getSupabaseAdmin();

    switch (action) {
      case 'check_admin':
        return res.status(200).json({ ok: true, role: admin.role });

      case 'platform_stats':
        return platformStats(sb, res);

      case 'list_organizations':
        return listOrganizations(sb, req, res);

      case 'get_organization':
        return getOrganization(sb, req, res);

      case 'update_organization':
        return updateOrganization(sb, req, res, admin);

      case 'list_users':
        return listUsers(sb, req, res);

      case 'update_user':
        return updateUser(sb, req, res, admin);

      case 'reset_password':
        return resetPassword(sb, req, res, admin);

      case 'change_plan':
        return changePlan(sb, req, res, admin);

      case 'revenue_history':
        return revenueHistory(sb, res);

      case 'audit_log':
        return getAuditLog(sb, req, res);

      default:
        return badRequest(res, 'Action invalide');
    }
  } catch (err) {
    console.error('[admin] Unhandled error:', err);
    return serverError(res);
  }
}

// ─── Platform Stats ───

async function platformStats(sb, res) {
  const { data: orgs } = await sb.from('organizations').select('id, plan, created_at');
  const { count: userCount } = await sb.from('profiles').select('id', { count: 'exact', head: true });

  const totalOrgs = orgs?.length || 0;
  const planDist = { starter: 0, professional: 0, enterprise: 0 };
  let mrr = 0;
  let newThisMonth = 0;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  (orgs || []).forEach((o) => {
    const p = o.plan || 'starter';
    if (planDist[p] !== undefined) planDist[p]++;
    mrr += PLAN_MONTHLY[p] || 0;
    if (o.created_at >= monthStart) newThisMonth++;
  });

  return res.status(200).json({
    totalOrgs,
    totalUsers: userCount || 0,
    mrr,
    arr: mrr * 12,
    planDistribution: planDist,
    newThisMonth,
    arpu: totalOrgs > 0 ? Math.round(mrr / totalOrgs) : 0,
  });
}

// ─── List Organizations ───

async function listOrganizations(sb, req, res) {
  const { search = '', plan = '', page = '1', limit = '20' } = req.query;
  const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const pg = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (pg - 1) * lim;

  let query = sb.from('organizations').select('*', { count: 'exact' });

  if (search) query = query.ilike('name', `%${sanitizeSearch(search)}%`);
  if (plan && plan !== 'all' && VALID_PLANS.includes(plan)) query = query.eq('plan', plan);

  query = query.order('created_at', { ascending: false }).range(offset, offset + lim - 1);
  const { data: orgs, count, error } = await query;
  if (error) return res.status(500).json({ error: 'Erreur lors de la récupération des organisations' });

  // Fetch member counts and contacts counts per org
  const orgIds = (orgs || []).map((o) => o.id);
  const enriched = [];

  for (const org of (orgs || [])) {
    const { count: memberCount } = await sb.from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.id);
    const { count: contactCount } = await sb.from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.id);

    enriched.push({
      ...org,
      memberCount: memberCount || 0,
      contactCount: contactCount || 0,
      monthlyRevenue: PLAN_MONTHLY[org.plan] || 0,
    });
  }

  return res.status(200).json({ organizations: enriched, total: count || 0, page: parseInt(page, 10), limit: lim });
}

// ─── Get Organization Detail ───

async function getOrganization(sb, req, res) {
  const orgId = req.query.org_id;
  if (!orgId) return badRequest(res, 'org_id requis');

  const { data: org, error } = await sb.from('organizations').select('*').eq('id', orgId).single();
  if (error || !org) return notFound(res, 'Organisation introuvable');

  const { data: members } = await sb.from('profiles').select('id, full_name, email, role, created_at').eq('org_id', orgId);
  const { count: contactCount } = await sb.from('contacts').select('id', { count: 'exact', head: true }).eq('org_id', orgId);
  const { data: finHistory } = await sb.from('financial_history')
    .select('period_key, ca, charges, marge')
    .eq('org_id', orgId)
    .order('period_key', { ascending: false })
    .limit(12);
  const { data: integrations } = await sb.from('integrations').select('name, connected, last_synced_at').eq('org_id', orgId);

  return res.status(200).json({
    ...org,
    monthlyRevenue: PLAN_MONTHLY[org.plan] || 0,
    members: members || [],
    contactCount: contactCount || 0,
    financialHistory: finHistory || [],
    integrations: integrations || [],
  });
}

// ─── Update Organization ───

async function updateOrganization(sb, req, res, admin) {
  const { org_id, name, sector, website } = req.body;
  if (!org_id) return badRequest(res, 'org_id requis');

  if (name !== undefined && !validateString(name)) return badRequest(res, 'name must be a string with max length 255');
  if (sector !== undefined && !validateString(sector)) return badRequest(res, 'sector must be a string with max length 255');
  if (website !== undefined && !validateString(website)) return badRequest(res, 'website must be a string with max length 255');

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (sector !== undefined) updates.sector = sector;
  if (website !== undefined) updates.website = website;

  const { error } = await sb.from('organizations').update(updates).eq('id', org_id);
  if (error) return res.status(500).json({ error: error.message });

  await logAdminAction(sb, admin.id, 'update_organization', 'organization', org_id, updates);
  return res.status(200).json({ ok: true });
}

// ─── List Users ───

async function listUsers(sb, req, res) {
  const { search = '', page = '1', limit = '20' } = req.query;
  const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const pg = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (pg - 1) * lim;

  let query = sb.from('profiles').select('id, full_name, email, role, org_id, created_at', { count: 'exact' });
  if (search) {
    const s = sanitizeSearch(search);
    query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%`);
  }
  query = query.order('created_at', { ascending: false }).range(offset, offset + lim - 1);
  const { data: users, count, error } = await query;
  if (error) return res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });

  // Fetch org names
  const orgIds = [...new Set((users || []).map((u) => u.org_id).filter(Boolean))];
  const orgMap = {};
  if (orgIds.length > 0) {
    const { data: orgs } = await sb.from('organizations').select('id, name, plan').in('id', orgIds);
    (orgs || []).forEach((o) => { orgMap[o.id] = o; });
  }

  const enriched = (users || []).map((u) => ({
    ...u,
    orgName: orgMap[u.org_id]?.name || '-',
    orgPlan: orgMap[u.org_id]?.plan || 'starter',
  }));

  return res.status(200).json({ users: enriched, total: count || 0, page: parseInt(page, 10), limit: lim });
}

// ─── Update User ───

async function updateUser(sb, req, res, admin) {
  const { user_id, full_name, role } = req.body;
  if (!user_id) return badRequest(res, 'user_id requis');

  if (role !== undefined && !VALID_ROLES.includes(role)) return badRequest(res, 'role must be one of: ' + VALID_ROLES.join(', '));
  if (full_name !== undefined && !validateString(full_name, 100)) return badRequest(res, 'full_name must be a string with max length 100');

  const updates = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (role !== undefined) updates.role = role;

  const { error } = await sb.from('profiles').update(updates).eq('id', user_id);
  if (error) return res.status(500).json({ error: error.message });

  await logAdminAction(sb, admin.id, 'update_user', 'user', user_id, updates);
  return res.status(200).json({ ok: true });
}

// ─── Reset Password ───

async function resetPassword(sb, req, res, admin) {
  const { user_id } = req.body;
  if (!user_id) return badRequest(res, 'user_id requis');

  const { data: profile } = await sb.from('profiles').select('email').eq('id', user_id).single();
  if (!profile) return notFound(res, 'Utilisateur introuvable');

  const { error } = await sb.auth.admin.generateLink({
    type: 'recovery',
    email: profile.email,
  });
  if (error) return res.status(500).json({ error: error.message });

  await logAdminAction(sb, admin.id, 'reset_password', 'user', user_id, { email: profile.email });
  return res.status(200).json({ ok: true, message: `Email de reset envoye a ${profile.email}` });
}

// ─── Change Plan ───

async function changePlan(sb, req, res, admin) {
  const { org_id, plan } = req.body;
  if (!org_id || !plan) return badRequest(res, 'org_id et plan requis');
  if (!VALID_PLANS.includes(plan)) return badRequest(res, 'plan must be one of: ' + VALID_PLANS.join(', '));

  const { data: org } = await sb.from('organizations').select('*').eq('id', org_id).single();
  if (!org) return notFound(res, 'Organisation introuvable');

  const oldPlan = org.plan;

  // Update in DB
  await sb.from('organizations').update({ plan }).eq('id', org_id);

  // If Stripe subscription exists, update it
  if (org.stripe_subscription_id && STRIPE_SECRET_KEY && PLAN_PRICES[plan]) {
    try {
      const stripe = await getStripe();
      const sub = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
      await stripe.subscriptions.update(org.stripe_subscription_id, {
        items: [{ id: sub.items.data[0].id, price: PLAN_PRICES[plan] }],
        proration_behavior: 'create_prorations',
      });
    } catch (err) {
      console.error('[admin] Stripe plan update failed (best-effort):', err.message);
    }
  }

  await logAdminAction(sb, admin.id, 'change_plan', 'organization', org_id, { from: oldPlan, to: plan });
  return res.status(200).json({ ok: true, from: oldPlan, to: plan });
}

// ─── Revenue History ───

async function revenueHistory(sb, res) {
  const { data: orgs } = await sb.from('organizations').select('id, name, plan, created_at, stripe_customer_id');

  // Build monthly revenue from plan subscriptions
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = d.toISOString();
    const activeOrgs = (orgs || []).filter((o) => o.created_at <= monthStart);
    const mrr = activeOrgs.reduce((s, o) => s + (PLAN_MONTHLY[o.plan] || 0), 0);
    months.push({ month: key, mrr, orgCount: activeOrgs.length });
  }

  const orgBreakdown = (orgs || []).map((o) => ({
    id: o.id,
    name: o.name,
    plan: o.plan,
    monthlyRevenue: PLAN_MONTHLY[o.plan] || 0,
    hasStripe: !!o.stripe_customer_id,
    createdAt: o.created_at,
  }));

  return res.status(200).json({ months, organizations: orgBreakdown });
}

// ─── Audit Log ───

async function getAuditLog(sb, req, res) {
  const { page = '1', limit = '50' } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const lim = parseInt(limit, 10);

  const { data, count, error } = await sb.from('admin_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + lim - 1);

  if (error) return res.status(500).json({ error: error.message });

  // Enrich with admin names
  const adminIds = [...new Set((data || []).map((d) => d.admin_user_id).filter(Boolean))];
  const adminMap = {};
  if (adminIds.length > 0) {
    const { data: profiles } = await sb.from('profiles').select('id, full_name, email').in('id', adminIds);
    (profiles || []).forEach((p) => { adminMap[p.id] = p; });
  }

  const enriched = (data || []).map((entry) => ({
    ...entry,
    adminName: adminMap[entry.admin_user_id]?.full_name || 'Inconnu',
    adminEmail: adminMap[entry.admin_user_id]?.email || '',
  }));

  return res.status(200).json({ entries: enriched, total: count || 0, page: parseInt(page, 10), limit: lim });
}
