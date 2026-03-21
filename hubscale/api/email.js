// HubScale — Email API (Vercel Serverless Function)
// Handles transactional emails via Resend (welcome, password reset, invoice)

import { getSupabaseAdmin } from './utils/supabase.js';
import { verifyAuth } from './utils/auth.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.VITE_APP_URL || 'https://hubscale.app';
const FROM_EMAIL = process.env.EMAIL_FROM || 'HubScale <noreply@hubscale.app>';

// ---------------------------------------------------------------------------
// Email Templates
// ---------------------------------------------------------------------------

function baseLayout(content) {
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
    .info-box { background: rgba(249,115,22,.08); border: 1px solid rgba(249,115,22,.2); border-radius: 10px; padding: 14px 18px; margin: 16px 0; }
    .info-box p { color: #fafafa; margin: 0; font-size: 13px; }
    .info-box .label { color: #a1a1aa; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo">H</div>
    <div class="brand">HubScale</div>
    <div class="subtitle">Espace client B2B</div>
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} HubScale. Tous droits r&eacute;serv&eacute;s.<br />
      Cet email a &eacute;t&eacute; envoy&eacute; automatiquement. Merci de ne pas y r&eacute;pondre.
    </div>
  </div>
</body>
</html>`;
}

function welcomeTemplate(name) {
  const displayName = name || 'there';
  return baseLayout(`
    <h2>Bienvenue sur HubScale !</h2>
    <p>Bonjour <span class="highlight">${displayName}</span>,</p>
    <p>
      Votre compte a &eacute;t&eacute; cr&eacute;&eacute; avec succ&egrave;s. Vous pouvez d&egrave;s maintenant
      acc&eacute;der &agrave; votre espace client et commencer &agrave; piloter votre activit&eacute; B2B.
    </p>
    <div class="info-box">
      <div class="label">Prochaines &eacute;tapes</div>
      <p>Compl&eacute;tez votre profil, connectez vos int&eacute;grations et explorez votre tableau de bord.</p>
    </div>
    <div class="btn-wrap">
      <a href="${APP_URL}" class="btn">Acc&eacute;der &agrave; mon espace</a>
    </div>
    <div class="divider"></div>
    <p style="font-size:12px; color:#52525b;">
      Si vous n'avez pas cr&eacute;&eacute; ce compte, vous pouvez ignorer cet email.
    </p>
  `);
}

function resetPasswordTemplate(resetLink) {
  return baseLayout(`
    <h2>R&eacute;initialisation du mot de passe</h2>
    <p>
      Vous avez demand&eacute; la r&eacute;initialisation de votre mot de passe.
      Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
    </p>
    <div class="btn-wrap">
      <a href="${resetLink}" class="btn">R&eacute;initialiser mon mot de passe</a>
    </div>
    <div class="divider"></div>
    <p style="font-size:12px; color:#52525b;">
      Ce lien expirera dans 1 heure. Si vous n'avez pas demand&eacute; cette r&eacute;initialisation,
      ignorez simplement cet email.
    </p>
    <p style="font-size:11px; color:#52525b; word-break:break-all;">
      Lien direct&nbsp;: <a href="${resetLink}" style="color:#f97316;">${resetLink}</a>
    </p>
  `);
}

function invoiceTemplate({ customerName, invoiceNumber, amount, currency, date, items, dashboardUrl }) {
  const displayCurrency = currency || 'EUR';
  const formattedAmount = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: displayCurrency }).format(amount || 0);
  const formattedDate = date || new Date().toLocaleDateString('fr-FR');

  let itemsHtml = '';
  if (items && items.length > 0) {
    const rows = items.map((item) => {
      const lineTotal = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: displayCurrency }).format(item.amount || 0);
      return `<tr>
        <td style="padding:8px 0; color:#fafafa; font-size:13px; border-bottom:1px solid #27272a;">${item.description || 'Article'}</td>
        <td style="padding:8px 0; color:#fafafa; font-size:13px; text-align:right; border-bottom:1px solid #27272a;">${lineTotal}</td>
      </tr>`;
    }).join('');

    itemsHtml = `
      <table style="width:100%; border-collapse:collapse; margin:16px 0;">
        <thead>
          <tr>
            <th style="text-align:left; padding:8px 0; color:#a1a1aa; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; border-bottom:1px solid #27272a;">Description</th>
            <th style="text-align:right; padding:8px 0; color:#a1a1aa; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; border-bottom:1px solid #27272a;">Montant</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td style="padding:12px 0; color:#fafafa; font-size:14px; font-weight:700;">Total</td>
            <td style="padding:12px 0; color:#f97316; font-size:14px; font-weight:700; text-align:right;">${formattedAmount}</td>
          </tr>
        </tfoot>
      </table>`;
  }

  return baseLayout(`
    <h2>Nouvelle facture</h2>
    <p>Bonjour <span class="highlight">${customerName || 'Client'}</span>,</p>
    <p>Une nouvelle facture est disponible sur votre espace HubScale.</p>
    <div class="info-box">
      <div class="label">D&eacute;tails de la facture</div>
      <p>
        <strong>N&deg;&nbsp;:</strong> ${invoiceNumber || '---'}<br />
        <strong>Date&nbsp;:</strong> ${formattedDate}<br />
        <strong>Montant&nbsp;:</strong> <span class="highlight">${formattedAmount}</span>
      </p>
    </div>
    ${itemsHtml}
    <div class="btn-wrap">
      <a href="${dashboardUrl || APP_URL}" class="btn">Voir ma facture</a>
    </div>
    <div class="divider"></div>
    <p style="font-size:12px; color:#52525b;">
      Pour toute question relative &agrave; cette facture, contactez notre &eacute;quipe support.
    </p>
  `);
}

function planChangeTemplate({ customerName, oldPlan, newPlan, amount, nextBillingDate }) {
  const planLabels = { starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise' };
  const displayOld = planLabels[oldPlan] || oldPlan || 'Gratuit';
  const displayNew = planLabels[newPlan] || newPlan || 'Starter';
  const formattedAmount = amount
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
    : null;
  const formattedDate = nextBillingDate
    ? new Date(nextBillingDate * 1000).toLocaleDateString('fr-FR')
    : null;

  return baseLayout(`
    <h2>Changement de plan</h2>
    <p>Bonjour <span class="highlight">${customerName || 'Client'}</span>,</p>
    <p>Votre abonnement HubScale a &eacute;t&eacute; mis &agrave; jour avec succ&egrave;s.</p>
    <div class="info-box">
      <div class="label">D&eacute;tails du changement</div>
      <p>
        <strong>Ancien plan&nbsp;:</strong> ${displayOld}<br />
        <strong>Nouveau plan&nbsp;:</strong> <span class="highlight">${displayNew}</span>
        ${formattedAmount ? `<br /><strong>Montant&nbsp;:</strong> ${formattedAmount}/mois` : ''}
        ${formattedDate ? `<br /><strong>Prochaine facturation&nbsp;:</strong> ${formattedDate}` : ''}
      </p>
    </div>
    <div class="btn-wrap">
      <a href="${APP_URL}" class="btn">Acc&eacute;der &agrave; mon espace</a>
    </div>
    <div class="divider"></div>
    <p style="font-size:12px; color:#52525b;">
      Si vous n'avez pas effectu&eacute; ce changement, contactez imm&eacute;diatement notre support.
    </p>
  `);
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
// Action handlers
// ---------------------------------------------------------------------------

async function handleWelcome(req, res, profile) {
  const { email, name } = req.body;
  const to = email || profile.email;
  const displayName = name || profile.full_name;

  const result = await sendEmail({
    to,
    subject: 'Bienvenue sur HubScale !',
    html: welcomeTemplate(displayName),
  });

  // Audit log
  const sb = getSupabaseAdmin();
  await sb.from('audit_log').insert({
    org_id: profile.org_id,
    user_id: profile.id,
    action: 'email_welcome_sent',
    entity_type: 'user',
    entity_id: profile.id,
    details: { to, resend_id: result.id },
  });

  return res.status(200).json({ ok: true, id: result.id });
}

async function handleResetPassword(req, res) {
  // Password reset does not require auth — the user is not logged in
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  const sb = getSupabaseAdmin();
  const redirectTo = `${APP_URL}/reset-password`;

  // Use Supabase built-in reset which sends its own email,
  // but we also send a branded Resend email for consistency.
  const { error: resetError } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (resetError) {
    console.error('[email] resetPasswordForEmail error:', resetError.message);
    // Don't expose whether the account exists
    return res.status(200).json({ ok: true });
  }

  // Optionally send a branded email via Resend as well.
  // The Supabase-generated reset link is handled by Supabase; here we send
  // a complementary notification. If RESEND_API_KEY is not set, skip.
  if (RESEND_API_KEY) {
    try {
      await sendEmail({
        to: email,
        subject: 'Réinitialisation de votre mot de passe — HubScale',
        html: resetPasswordTemplate(redirectTo),
      });
    } catch (err) {
      // Non-blocking: Supabase already sent the real reset link
      console.error('[email] Resend branded reset email failed:', err.message);
    }
  }

  return res.status(200).json({ ok: true });
}

async function handleInvoice(req, res, profile) {
  const { email, customerName, invoiceNumber, amount, currency, date, items } = req.body;
  const to = email || profile.email;

  const result = await sendEmail({
    to,
    subject: `Facture ${invoiceNumber || ''} — HubScale`.trim(),
    html: invoiceTemplate({
      customerName: customerName || profile.full_name,
      invoiceNumber,
      amount,
      currency,
      date,
      items,
      dashboardUrl: `${APP_URL}`,
    }),
  });

  // Audit log
  const sb = getSupabaseAdmin();
  await sb.from('audit_log').insert({
    org_id: profile.org_id,
    user_id: profile.id,
    action: 'email_invoice_sent',
    entity_type: 'invoice',
    entity_id: invoiceNumber || 'unknown',
    details: { to, invoiceNumber, amount, resend_id: result.id },
  });

  return res.status(200).json({ ok: true, id: result.id });
}

async function handlePlanChange(req, res, profile) {
  const { email, customerName, oldPlan, newPlan, amount, nextBillingDate } = req.body;
  const to = email || profile.email;

  const result = await sendEmail({
    to,
    subject: `Votre plan a été mis à jour — HubScale`,
    html: planChangeTemplate({
      customerName: customerName || profile.full_name,
      oldPlan,
      newPlan,
      amount,
      nextBillingDate,
    }),
  });

  // Audit log
  const sb = getSupabaseAdmin();
  await sb.from('audit_log').insert({
    org_id: profile.org_id,
    user_id: profile.id,
    action: 'email_plan_change_sent',
    entity_type: 'subscription',
    entity_id: profile.org_id,
    details: { to, oldPlan, newPlan, resend_id: result.id },
  });

  return res.status(200).json({ ok: true, id: result.id });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', APP_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action } = req.body || {};

    // Password reset is a public action (user is not authenticated)
    if (action === 'reset_password') {
      return handleResetPassword(req, res);
    }

    // All other actions require authentication
    const profile = await verifyAuth(req);
    if (!profile) return res.status(401).json({ error: 'Non autorisé' });

    if (action === 'welcome') {
      return handleWelcome(req, res, profile);
    } else if (action === 'invoice') {
      return handleInvoice(req, res, profile);
    } else if (action === 'plan_change') {
      return handlePlanChange(req, res, profile);
    }

    return res.status(400).json({ error: 'Action invalide' });
  } catch (err) {
    console.error('[email]', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
