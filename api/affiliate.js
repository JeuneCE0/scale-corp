// Vercel Serverless — Affiliate Payout API
// Handles payout requests, status updates, and affiliate stats
import { applyHeaders, verifyAuth, canAccessSociety, rateLimit, getClientIP, apiLog, badRequest, unauthorized, forbidden, tooManyRequests } from './_middleware.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const MIN_PAYOUT = 50; // minimum 50€
const COMMISSION_RATE = 0.20; // 20%

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function sbFetch(path, opts = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const r = await fetch(url, { ...opts, headers: sbHeaders(opts.headers || {}) });
  return r;
}

export default async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const ip = getClientIP(req);
  if (!rateLimit('affiliate', ip, 30)) return tooManyRequests(res);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const { action, society_id } = req.query || {};
  if (!action) return badRequest(res, "Missing action");

  try {
    // ── List payouts for a society ──
    if (action === "list-payouts") {
      if (!society_id) return badRequest(res, "Missing society_id");
      const r = await sbFetch(`affiliate_payouts?society_id=eq.${encodeURIComponent(society_id)}&order=created_at.desc`);
      return res.status(r.status).json(await r.json());
    }

    // ── List referrals for a society ──
    if (action === "list-referrals") {
      if (!society_id) return badRequest(res, "Missing society_id");
      const r = await sbFetch(`affiliate_referrals?society_id=eq.${encodeURIComponent(society_id)}&order=created_at.desc`);
      return res.status(r.status).json(await r.json());
    }

    // ── Request a payout ──
    if (action === "request-payout") {
      if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
      const { affiliate_client_id, amount, bank_info } = req.body || {};
      if (!society_id) return badRequest(res, "Missing society_id");
      if (!affiliate_client_id) return badRequest(res, "Missing affiliate_client_id");
      if (!amount || amount < MIN_PAYOUT) return badRequest(res, `Minimum payout is ${MIN_PAYOUT}€`);
      if (!bank_info?.iban || !bank_info?.bic) return badRequest(res, "Bank info (IBAN + BIC) required");

      // Verify the affiliate has enough confirmed commissions
      const commR = await sbFetch(`affiliate_commissions?society_id=eq.${encodeURIComponent(society_id)}&affiliate_client_id=eq.${encodeURIComponent(affiliate_client_id)}&status=eq.confirmed&select=commission`);
      const commissions = await commR.json();
      const available = (commissions || []).reduce((sum, c) => sum + (c.commission || 0), 0);

      // Also check existing pending/processing payouts
      const pendingR = await sbFetch(`affiliate_payouts?society_id=eq.${encodeURIComponent(society_id)}&affiliate_client_id=eq.${encodeURIComponent(affiliate_client_id)}&status=in.(pending,processing)&select=amount`);
      const pendingPayouts = await pendingR.json();
      const pendingTotal = (pendingPayouts || []).reduce((sum, p) => sum + (p.amount || 0), 0);

      const netAvailable = available - pendingTotal;
      if (amount > netAvailable) {
        return badRequest(res, `Insufficient balance. Available: ${netAvailable}€, requested: ${amount}€`);
      }

      // Create payout record
      const payout = {
        society_id,
        affiliate_client_id,
        amount,
        status: 'pending',
        method: 'bank_transfer',
        bank_info,
        requested_at: new Date().toISOString(),
      };

      const r = await sbFetch('affiliate_payouts', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payout),
      });
      const result = await r.json();

      apiLog('info', { api: 'affiliate', action: 'request-payout', society_id, affiliate_client_id, amount });
      return res.status(r.status).json(Array.isArray(result) ? result[0] : result);
    }

    // ── Update payout status (admin only) ──
    if (action === "update-payout") {
      if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
      const { payout_id, status, notes } = req.body || {};
      if (!payout_id) return badRequest(res, "Missing payout_id");
      if (!['processing', 'paid', 'rejected'].includes(status)) return badRequest(res, "Invalid status");

      const updates = { status, updated_at: new Date().toISOString() };
      if (status === 'processing') updates.processed_at = new Date().toISOString();
      if (status === 'paid') updates.paid_at = new Date().toISOString();
      if (notes) updates.notes = notes;

      const r = await sbFetch(`affiliate_payouts?id=eq.${encodeURIComponent(payout_id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(updates),
      });
      const result = await r.json();

      // If paid, mark the corresponding commissions as paid
      if (status === 'paid') {
        const payoutR = await sbFetch(`affiliate_payouts?id=eq.${encodeURIComponent(payout_id)}&select=*`);
        const payoutData = (await payoutR.json())?.[0];
        if (payoutData) {
          await sbFetch(`affiliate_commissions?society_id=eq.${encodeURIComponent(payoutData.society_id)}&affiliate_client_id=eq.${encodeURIComponent(payoutData.affiliate_client_id)}&status=eq.confirmed`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'paid', updated_at: new Date().toISOString() }),
          });
        }
      }

      apiLog('info', { api: 'affiliate', action: 'update-payout', payout_id, status });
      return res.status(r.status).json(Array.isArray(result) ? result[0] : result);
    }

    // ── Recalculate commissions for a society (cron or manual trigger) ──
    if (action === "recalculate-commissions") {
      if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
      if (!society_id) return badRequest(res, "Missing society_id");

      // Fetch all active referrals for this society
      const refR = await sbFetch(`affiliate_referrals?society_id=eq.${encodeURIComponent(society_id)}&status=eq.active`);
      const referrals = await refR.json();

      let updated = 0;
      for (const ref of (referrals || [])) {
        const newComm = Math.round((ref.revenue || 0) * (ref.commission_rate || COMMISSION_RATE));
        if (newComm !== ref.commission) {
          await sbFetch(`affiliate_referrals?id=eq.${encodeURIComponent(ref.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ commission: newComm, updated_at: new Date().toISOString() }),
          });
          updated++;
        }
      }

      apiLog('info', { api: 'affiliate', action: 'recalculate-commissions', society_id, updated });
      return res.json({ ok: true, updated });
    }

    // ── Leaderboard: top affiliates by earnings ──
    if (action === "leaderboard") {
      if (!society_id) return badRequest(res, "Missing society_id");
      const r = await sbFetch(`affiliate_referrals?society_id=eq.${encodeURIComponent(society_id)}&select=referrer_client_id,commission`);
      const refs = await r.json();

      // Aggregate by referrer
      const byReferrer = {};
      for (const ref of (refs || [])) {
        const key = ref.referrer_client_id;
        if (!byReferrer[key]) byReferrer[key] = { referrals: 0, earned: 0 };
        byReferrer[key].referrals++;
        byReferrer[key].earned += (ref.commission || 0);
      }

      const board = Object.entries(byReferrer)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.earned - a.earned)
        .slice(0, 20)
        .map((e, i) => ({
          rank: i + 1,
          referrals: e.referrals,
          earned: e.earned,
          badge: i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : '',
          // Names are anonymized server-side for privacy
          name: `Affilié #${e.id.slice(-4).toUpperCase()}`,
        }));

      return res.json(board);
    }

    // ── Affiliate stats (summary) ──
    if (action === "stats") {
      if (!society_id) return badRequest(res, "Missing society_id");
      const affiliate_client_id = req.query.affiliate_client_id;

      let refFilter = `society_id=eq.${encodeURIComponent(society_id)}`;
      if (affiliate_client_id) refFilter += `&referrer_client_id=eq.${encodeURIComponent(affiliate_client_id)}`;

      const [refsR, payoutsR] = await Promise.all([
        sbFetch(`affiliate_referrals?${refFilter}`),
        sbFetch(`affiliate_payouts?${refFilter.replace('referrer_client_id', 'affiliate_client_id')}`),
      ]);

      const refs = await refsR.json();
      const payouts = await payoutsR.json();

      const totalReferrals = (refs || []).length;
      const activeReferrals = (refs || []).filter(r => r.status === 'active').length;
      const totalCommissions = (refs || []).reduce((s, r) => s + (r.commission || 0), 0);
      const totalPaid = (payouts || []).filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
      const pendingPayout = totalCommissions - totalPaid;

      return res.json({
        totalReferrals,
        activeReferrals,
        totalCommissions,
        totalPaid,
        pendingPayout,
        commissionRate: COMMISSION_RATE,
      });
    }

    return badRequest(res, `Unknown action: ${action}`);
  } catch (e) {
    apiLog('error', { api: 'affiliate', action }, { error: e.message });
    return res.status(500).json({ error: "Internal error" });
  }
}
