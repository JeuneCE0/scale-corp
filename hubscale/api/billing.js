// HubScale — Billing API (Vercel Serverless Function)
// Handles Stripe Checkout, Subscriptions, and Billing Portal

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const APP_URL = process.env.VITE_APP_URL || 'https://hubscale.app';

// Plans mapping
const PLAN_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

async function getStripe() {
  const Stripe = (await import('stripe')).default;
  return new Stripe(STRIPE_SECRET_KEY);
}

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// Read raw body from request stream (needed for Stripe webhook signature)
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Disable Vercel auto body-parsing so we can read the raw body for webhooks
export const config = { api: { bodyParser: false } };

async function verifyAuth(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);

  const sb = getSupabaseAdmin();
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  return profile;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', APP_URL);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Stripe Webhook — use raw body for signature verification
    if (req.method === 'POST' && req.headers['stripe-signature']) {
      const rawBody = await getRawBody(req);
      return handleWebhook(req, res, rawBody);
    }

    // For non-webhook requests, parse JSON body manually (bodyParser is disabled)
    if (req.method === 'POST' && !req.body) {
      try {
        const rawBody = await getRawBody(req);
        req.body = JSON.parse(rawBody.toString());
      } catch { req.body = {}; }
    }

    const profile = await verifyAuth(req);
    if (!profile) return res.status(401).json({ error: 'Non autorisé' });

    const action = req.method === 'GET'
      ? req.query.action
      : (req.body?.action || req.query.action);

    if (action === 'create_checkout') {
      return createCheckout(req, res, profile);
    } else if (action === 'subscription') {
      return getSubscription(req, res, profile);
    } else if (action === 'portal') {
      return createPortal(req, res, profile);
    }

    return res.status(400).json({ error: 'Action invalide' });
  } catch (err) {
    console.error('[billing]', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function createCheckout(req, res, profile) {
  const { planId } = req.body;
  const priceId = PLAN_PRICES[planId];
  if (!priceId) return res.status(400).json({ error: 'Plan invalide' });

  const stripe = await getStripe();
  const sb = getSupabaseAdmin();

  // Get or create Stripe customer
  const { data: org } = await sb.from('organizations').select('*').eq('id', profile.org_id).single();
  let customerId = org?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      name: org?.name || profile.full_name,
      metadata: { org_id: profile.org_id, user_id: profile.id },
    });
    customerId = customer.id;
    await sb.from('organizations').update({ stripe_customer_id: customerId }).eq('id', profile.org_id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}?checkout=cancel`,
    metadata: { org_id: profile.org_id },
  });

  return res.status(200).json({ url: session.url, sessionId: session.id });
}

async function getSubscription(req, res, profile) {
  const sb = getSupabaseAdmin();
  const { data: org } = await sb.from('organizations').select('*').eq('id', profile.org_id).single();

  if (!org?.stripe_subscription_id) {
    return res.status(200).json({ subscription: null, plan: org?.plan || 'starter' });
  }

  const stripe = await getStripe();
  const sub = await stripe.subscriptions.retrieve(org.stripe_subscription_id);

  return res.status(200).json({
    subscription: {
      id: sub.id,
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    plan: org.plan,
  });
}

async function createPortal(req, res, profile) {
  const sb = getSupabaseAdmin();
  const { data: org } = await sb.from('organizations').select('stripe_customer_id').eq('id', profile.org_id).single();

  if (!org?.stripe_customer_id) {
    return res.status(400).json({ error: 'Aucun abonnement actif' });
  }

  const stripe = await getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${APP_URL}`,
  });

  return res.status(200).json({ url: session.url });
}

async function handleWebhook(req, res, rawBody) {
  const stripe = await getStripe();
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Signature invalide' });
  }

  const sb = getSupabaseAdmin();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const orgId = session.metadata.org_id;
      const subscriptionId = session.subscription;

      // Determine plan from price
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = sub.items.data[0]?.price?.id;
      const plan = Object.entries(PLAN_PRICES).find(([, id]) => id === priceId)?.[0] || 'starter';

      await sb.from('organizations').update({
        stripe_subscription_id: subscriptionId,
        plan,
      }).eq('id', orgId);

      // Log audit
      await sb.from('audit_log').insert({
        org_id: orgId,
        action: 'subscription_created',
        entity_type: 'organization',
        entity_id: orgId,
        details: { plan, subscription_id: subscriptionId },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const customerId = sub.customer;

      const { data: org } = await sb.from('organizations')
        .select('id').eq('stripe_customer_id', customerId).single();

      if (org) {
        const priceId = sub.items.data[0]?.price?.id;
        const plan = Object.entries(PLAN_PRICES).find(([, id]) => id === priceId)?.[0] || 'starter';
        await sb.from('organizations').update({ plan }).eq('id', org.id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const customerId = sub.customer;

      const { data: org } = await sb.from('organizations')
        .select('id').eq('stripe_customer_id', customerId).single();

      if (org) {
        await sb.from('organizations').update({
          plan: 'starter',
          stripe_subscription_id: null,
        }).eq('id', org.id);
      }
      break;
    }
  }

  return res.status(200).json({ received: true });
}
