// HubScale — Billing API (Vercel Serverless Function)
// Handles Stripe Checkout, Subscriptions, and Billing Portal

import { getSupabaseAdmin } from './utils/supabase.js';
import { verifyAuth } from './utils/auth.js';
import { cors, unauthorized, badRequest, serverError } from './utils/errors.js';

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

export default async function handler(req, res) {
  cors(res, 'GET, POST, OPTIONS');
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
    if (!profile) return unauthorized(res);

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

    return badRequest(res, 'Action invalide');
  } catch (err) {
    console.error('[billing] Unhandled error:', err);
    return serverError(res);
  }
}

const TRIAL_DAYS = 14;

async function createCheckout(req, res, profile) {
  const { planId, skipTrial } = req.body;
  const priceId = PLAN_PRICES[planId];
  if (!priceId) return badRequest(res, 'Plan invalide');

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

  // Check if org already had a subscription (no trial for returning customers)
  const hadSubscription = !!org?.stripe_subscription_id;
  const enableTrial = !skipTrial && !hadSubscription;

  const sessionParams = {
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}?checkout=cancel`,
    metadata: { org_id: profile.org_id },
  };

  if (enableTrial) {
    sessionParams.subscription_data = {
      trial_period_days: TRIAL_DAYS,
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  // Store trial end date in org if trial is enabled
  if (enableTrial) {
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await sb.from('organizations').update({ trial_ends_at: trialEndsAt }).eq('id', profile.org_id);
  }

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
    return badRequest(res, 'Aucun abonnement actif');
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
    console.error('[billing] Webhook signature verification failed:', err.message);
    return badRequest(res, 'Signature invalide');
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
        .select('id, plan').eq('stripe_customer_id', customerId).single();

      if (org) {
        const priceId = sub.items.data[0]?.price?.id;
        const newPlan = Object.entries(PLAN_PRICES).find(([, id]) => id === priceId)?.[0] || 'starter';
        const oldPlan = org.plan;
        await sb.from('organizations').update({ plan: newPlan }).eq('id', org.id);

        // Send plan change email notification if plan actually changed
        if (oldPlan && oldPlan !== newPlan) {
          try {
            // Find org owner to send email
            const { data: owner } = await sb.from('profiles')
              .select('email, full_name')
              .eq('org_id', org.id)
              .eq('role', 'owner')
              .single();

            if (owner?.email) {
              const amount = sub.items.data[0]?.price?.unit_amount
                ? sub.items.data[0].price.unit_amount / 100
                : null;
              await fetch(`${APP_URL}/api/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'plan_change',
                  email: owner.email,
                  customerName: owner.full_name,
                  oldPlan,
                  newPlan,
                  amount,
                  nextBillingDate: sub.current_period_end,
                }),
              });
            }
          } catch (err) {
            console.error('[billing] Plan change email failed (non-blocking):', err.message);
          }
        }

        // Audit log
        await sb.from('audit_log').insert({
          org_id: org.id,
          action: 'subscription_updated',
          entity_type: 'organization',
          entity_id: org.id,
          details: { oldPlan, newPlan, subscription_id: sub.id },
        });
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
