// HubScale — Affiliate API (Vercel Serverless Function)
// Handles referral tracking, click recording, and affiliate dashboard data.
// Public endpoints (track-click, record-referral) don't require auth.
// Dashboard endpoints require auth.

import { getSupabaseAdmin } from './utils/supabase.js';
import { cors, badRequest, serverError } from './utils/errors.js';

function getIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
}

// Simple in-memory rate limiter for public affiliate endpoints
const _rateLimitMap = new Map();
function checkRateLimit(key, maxRequests = 30, windowMs = 60000) {
  const now = Date.now();
  const entry = _rateLimitMap.get(key);
  if (!entry || now - entry.start > windowMs) {
    _rateLimitMap.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > maxRequests) return false;
  return true;
}

export default async function handler(req, res) {
  cors(res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sb = getSupabaseAdmin();
  const action = req.query.action;
  if (!action) return res.status(400).json({ error: 'Missing action' });

  try {
    // Rate limit public endpoints by IP
    const ip = getIP(req);
    if (['track-click', 'record-referral', 'register-slug'].includes(action)) {
      if (!checkRateLimit(`aff_${ip}`, 20, 60000)) {
        return res.status(429).json({ error: 'Trop de requêtes. Réessayez dans quelques instants.' });
      }
    }

    // ── PUBLIC: Track a click on an affiliate link ──
    if (action === 'track-click') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
      const { slug } = req.body || {};
      if (!slug) return res.status(400).json({ error: 'Missing slug' });

      // Find the affiliate by slug
      const { data: affiliate } = await sb.from('affiliates').select('id').eq('slug', slug).single();
      if (!affiliate) return res.json({ ok: true, tracked: false }); // Slug not found, silently ignore

      const { error } = await sb.from('affiliate_clicks').insert({
        affiliate_id: affiliate.id,
        slug,
        ip: getIP(req),
        user_agent: (req.headers['user-agent'] || '').slice(0, 500),
      });

      return res.json({ ok: !error, tracked: true });
    }

    // ── PUBLIC: Record a referral (called during signup) ──
    if (action === 'record-referral') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
      const { slug, name, email, plan, sale_amount } = req.body || {};
      if (!slug) return res.status(400).json({ error: 'Missing slug' });
      if (!email) return res.status(400).json({ error: 'Missing email' });

      // Find the affiliate by slug
      const { data: affiliate } = await sb.from('affiliates').select('id').eq('slug', slug).single();
      if (!affiliate) return res.json({ ok: false, error: 'Affiliate not found' });

      // Check if referral already exists for this email
      const { data: existing } = await sb.from('affiliate_referrals')
        .select('id').eq('affiliate_id', affiliate.id).eq('email', email.toLowerCase().trim());
      if (existing && existing.length > 0) {
        return res.json({ ok: true, existing: true });
      }

      const potentialCommission = Math.round((sale_amount || 0) * 0.2 * 100) / 100;
      const { data: referral, error } = await sb.from('affiliate_referrals').insert({
        affiliate_id: affiliate.id,
        name: name || '',
        email: (email || '').toLowerCase().trim(),
        plan: plan || '',
        status: 'pending',
        sale_amount: sale_amount || 0,
        commission_earned: 0,
        potential_commission: potentialCommission,
        trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
        first_charge_confirmed: false,
        joined_at: new Date().toISOString(),
      }).select().single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ok: true, referral });
    }

    // ── PUBLIC: Register/ensure an affiliate slug exists ──
    if (action === 'register-slug') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
      const { slug, org_id } = req.body || {};
      if (!slug || !org_id) return res.status(400).json({ error: 'Missing slug or org_id' });

      // Check if this org already has an affiliate record
      const { data: existing } = await sb.from('affiliates').select('*').eq('org_id', org_id).single();
      if (existing) return res.json({ ok: true, affiliate: existing });

      // Check slug uniqueness
      const { data: slugCheck } = await sb.from('affiliates').select('id').eq('slug', slug);
      if (slugCheck && slugCheck.length > 0) {
        return res.status(409).json({ error: 'Slug already taken' });
      }

      const { data: affiliate, error } = await sb.from('affiliates').insert({
        org_id,
        slug,
      }).select().single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ok: true, affiliate });
    }

    // ── AUTH: Get affiliate dashboard data ──
    if (action === 'dashboard') {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Auth required' });
      const token = auth.slice(7);

      const { data: { user }, error: authErr } = await sb.auth.getUser(token);
      if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

      const { data: profile } = await sb.from('profiles').select('org_id').eq('id', user.id).single();
      if (!profile) return res.status(404).json({ error: 'Profile not found' });

      // Get or create affiliate
      let { data: affiliate } = await sb.from('affiliates').select('*').eq('org_id', profile.org_id).single();

      if (!affiliate) {
        return res.json({ ok: true, affiliate: null, referrals: [], clicks: 0, payouts: [] });
      }

      // Fetch referrals
      const { data: referrals } = await sb.from('affiliate_referrals')
        .select('*').eq('affiliate_id', affiliate.id).order('joined_at', { ascending: false });

      // Count clicks
      const { count: clickCount } = await sb.from('affiliate_clicks')
        .select('id', { count: 'exact', head: true }).eq('affiliate_id', affiliate.id);

      // Get daily click counts for last 7 days
      const clickDays = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const { count } = await sb.from('affiliate_clicks')
          .select('id', { count: 'exact', head: true })
          .eq('affiliate_id', affiliate.id)
          .gte('created_at', dayStr + 'T00:00:00Z')
          .lt('created_at', dayStr + 'T23:59:59Z');
        clickDays.push({ date: dayStr, count: count || 0 });
      }

      // Fetch payouts
      const { data: payouts } = await sb.from('affiliate_payouts')
        .select('*').eq('affiliate_id', affiliate.id).order('requested_at', { ascending: false });

      return res.json({
        ok: true,
        affiliate,
        referrals: referrals || [],
        clicks: clickCount || 0,
        clickDays,
        payouts: payouts || [],
      });
    }

    // ── AUTH: Request payout ──
    if (action === 'request-payout') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Auth required' });
      const token = auth.slice(7);

      const { data: { user }, error: authErr } = await sb.auth.getUser(token);
      if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

      const { data: profile } = await sb.from('profiles').select('org_id').eq('id', user.id).single();
      if (!profile) return res.status(404).json({ error: 'Profile not found' });

      const { data: affiliate } = await sb.from('affiliates').select('*').eq('org_id', profile.org_id).single();
      if (!affiliate) return res.status(404).json({ error: 'Affiliate not found' });

      const { amount, bank_info } = req.body || {};
      if (!amount || amount < 50) return res.status(400).json({ error: 'Minimum payout: 50€' });

      // Save bank info if provided
      if (bank_info) {
        await sb.from('affiliates').update({ bank_info }).eq('id', affiliate.id);
      }

      const { data: payout, error } = await sb.from('affiliate_payouts').insert({
        affiliate_id: affiliate.id,
        amount,
        status: 'pending',
        method: 'bank_transfer',
        bank_info: bank_info || affiliate.bank_info,
      }).select().single();

      if (error) return res.status(500).json({ error: error.message });

      // Update total_paid
      await sb.from('affiliates').update({
        total_paid: affiliate.total_paid + amount,
      }).eq('id', affiliate.id);

      return res.json({ ok: true, payout });
    }

    // ── AUTH: Save bank info ──
    if (action === 'save-bank-info') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Auth required' });
      const token = auth.slice(7);

      const { data: { user }, error: authErr } = await sb.auth.getUser(token);
      if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

      const { data: profile } = await sb.from('profiles').select('org_id').eq('id', user.id).single();
      if (!profile) return res.status(404).json({ error: 'Profile not found' });

      const { bank_info } = req.body || {};
      if (!bank_info?.iban) return res.status(400).json({ error: 'IBAN required' });

      const { error } = await sb.from('affiliates')
        .update({ bank_info }).eq('org_id', profile.org_id);

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (e) {
    console.error('Affiliate API error:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
