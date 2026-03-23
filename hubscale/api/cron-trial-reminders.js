// HubScale — Trial Reminder Cron (Vercel Cron Job)
// Sends email reminders to users whose trial is about to expire (J-3, J-1, J0)

import { getSupabaseAdmin } from './utils/supabase.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.VITE_APP_URL || 'https://hubscale.app';
const FROM_EMAIL = process.env.EMAIL_FROM || 'HubScale <noreply@hubscale.app>';
const CRON_SECRET = process.env.CRON_SECRET;

// ---------------------------------------------------------------------------
// Email template
// ---------------------------------------------------------------------------

function trialReminderTemplate({ customerName, daysLeft, plan }) {
  const planLabels = { starter: 'Essentiel', professional: 'Business', enterprise: 'Scale' };
  const displayPlan = planLabels[plan] || plan || 'votre plan';

  const urgencyColor = daysLeft === 0 ? '#ef4444' : daysLeft === 1 ? '#f97316' : '#f59e0b';
  const headline = daysLeft === 0
    ? 'Votre essai gratuit expire aujourd\'hui'
    : daysLeft === 1
      ? 'Plus que 24h sur votre essai gratuit'
      : `Plus que ${daysLeft} jours sur votre essai gratuit`;

  const message = daysLeft === 0
    ? 'Votre p\u00e9riode d\'essai se termine aujourd\'hui. Pour continuer \u00e0 utiliser HubScale sans interruption, activez votre abonnement d\u00e8s maintenant.'
    : `Il vous reste ${daysLeft} jour${daysLeft > 1 ? 's' : ''} pour profiter de toutes les fonctionnalit\u00e9s de HubScale. Apr\u00e8s cette date, votre acc\u00e8s sera limit\u00e9.`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HubScale</title>
  <style>
    body { margin: 0; padding: 0; background: #09090b; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #111113; border: 1px solid #27272a; border-radius: 16px; padding: 32px 28px; }
    .logo { width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, #f97316, #f59e0b); color: #fff; font-size: 22px; font-weight: 800; text-align: center; line-height: 48px; margin: 0 auto 16px; }
    .brand { text-align: center; font-size: 20px; font-weight: 800; color: #fafafa; margin: 0 0 4px; }
    .subtitle { text-align: center; font-size: 12px; color: #a1a1aa; margin: 0 0 28px; }
    h2 { color: #fafafa; font-size: 18px; font-weight: 700; margin: 0 0 12px; }
    p { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
    .btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #f97316, #f59e0b); color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px; }
    .btn-wrap { text-align: center; margin: 24px 0; }
    .divider { height: 1px; background: #27272a; margin: 24px 0; }
    .footer { text-align: center; color: #52525b; font-size: 11px; margin-top: 24px; line-height: 1.5; }
    .highlight { color: #f97316; font-weight: 700; }
    .info-box { border: 1px solid; border-radius: 10px; padding: 14px 18px; margin: 16px 0; }
    .info-box p { color: #fafafa; margin: 0; font-size: 13px; }
    .info-box .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo">H</div>
    <div class="brand">HubScale</div>
    <div class="subtitle">Espace client B2B</div>
    <div class="card">
      <h2>${headline}</h2>
      <p>Bonjour <span class="highlight">${customerName || 'there'}</span>,</p>
      <p>${message}</p>
      <div class="info-box" style="background: ${urgencyColor}08; border-color: ${urgencyColor}33;">
        <div class="label" style="color: ${urgencyColor};">&Eacute;tat de votre essai</div>
        <p>
          <strong>Plan&nbsp;:</strong> ${displayPlan}<br />
          <strong>Jours restants&nbsp;:</strong> <span style="color: ${urgencyColor}; font-weight: 700;">${daysLeft}</span>
        </p>
      </div>
      <div class="btn-wrap">
        <a href="${APP_URL}" class="btn">Activer mon abonnement</a>
      </div>
      <div class="divider"></div>
      <p style="font-size:12px; color:#52525b;">
        Des questions&nbsp;? R&eacute;pondez &agrave; cet email ou contactez notre &eacute;quipe support.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} HubScale. Tous droits r&eacute;serv&eacute;s.<br />
      Cet email a &eacute;t&eacute; envoy&eacute; automatiquement.
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Resend helper
// ---------------------------------------------------------------------------

async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Resend error: ${res.status}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Main handler — called by Vercel Cron
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!RESEND_API_KEY) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'RESEND_API_KEY not configured' });
  }

  try {
    const sb = getSupabaseAdmin();
    const now = new Date();
    const results = { sent: 0, errors: 0, details: [] };

    // Find orgs with trials ending in 0, 1, or 3 days
    for (const daysLeft of [3, 1, 0]) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysLeft);
      const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).toISOString();
      const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1).toISOString();

      const { data: orgs, error: orgsError } = await sb
        .from('organizations')
        .select('id, name, plan, trial_ends_at')
        .gte('trial_ends_at', dayStart)
        .lt('trial_ends_at', dayEnd)
        .is('stripe_subscription_id', null); // Only orgs without active subscription

      if (orgsError) {
        console.error(`[cron] Error fetching orgs for J-${daysLeft}:`, orgsError.message);
        continue;
      }

      if (!orgs || orgs.length === 0) continue;

      for (const org of orgs) {
        try {
          // Get org owner
          const { data: owner } = await sb
            .from('profiles')
            .select('email, full_name')
            .eq('org_id', org.id)
            .eq('role', 'owner')
            .single();

          if (!owner?.email) continue;

          // Check if we already sent this reminder (idempotency)
          const reminderKey = `trial_reminder_j${daysLeft}`;
          const { data: existing } = await sb
            .from('audit_log')
            .select('id')
            .eq('org_id', org.id)
            .eq('action', reminderKey)
            .limit(1);

          if (existing && existing.length > 0) continue;

          // Send the email
          const subject = daysLeft === 0
            ? 'Votre essai HubScale expire aujourd\'hui'
            : `Plus que ${daysLeft} jour${daysLeft > 1 ? 's' : ''} sur votre essai HubScale`;

          const result = await sendEmail({
            to: owner.email,
            subject,
            html: trialReminderTemplate({
              customerName: owner.full_name,
              daysLeft,
              plan: org.plan,
            }),
          });

          // Log to audit for idempotency
          await sb.from('audit_log').insert({
            org_id: org.id,
            action: reminderKey,
            entity_type: 'organization',
            entity_id: org.id,
            details: { to: owner.email, daysLeft, resend_id: result.id },
          });

          results.sent++;
          results.details.push({ org: org.id, daysLeft, email: owner.email });
        } catch (err) {
          console.error(`[cron] Error sending reminder to org ${org.id}:`, err.message);
          results.errors++;
        }
      }
    }

    return res.status(200).json({ ok: true, ...results });
  } catch (err) {
    console.error('[cron] Unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
