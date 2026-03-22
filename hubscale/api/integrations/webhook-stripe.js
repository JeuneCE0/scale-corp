// HubScale — Stripe Integration Webhook (Vercel Serverless Function)
// Receives Stripe webhook events and syncs transaction data in real-time
// This is separate from billing.js webhooks which handle subscription lifecycle

import { getSupabaseAdmin } from '../utils/supabase.js';

const STRIPE_INTEGRATION_WEBHOOK_SECRET = process.env.STRIPE_INTEGRATION_WEBHOOK_SECRET;

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    if (!STRIPE_INTEGRATION_WEBHOOK_SECRET) {
      console.error('[webhook-stripe] Missing STRIPE_INTEGRATION_WEBHOOK_SECRET');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_INTEGRATION_WEBHOOK_SECRET);
    } catch (err) {
      console.error('[webhook-stripe] Signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const sb = getSupabaseAdmin();

    // Find the org that owns this Stripe account
    const stripeAccountId = event.account; // For Connect events
    let orgId = null;

    if (stripeAccountId) {
      const { data: integ } = await sb
        .from('integrations')
        .select('org_id')
        .eq('name', 'stripe')
        .eq('connected', true)
        .filter('metadata->>stripe_user_id', 'eq', stripeAccountId)
        .single();
      orgId = integ?.org_id;
    }

    // If no Connect account, try to match by looking up the customer's org
    if (!orgId && event.data?.object?.customer) {
      const { data: org } = await sb
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', event.data.object.customer)
        .single();
      orgId = org?.id;
    }

    if (!orgId) {
      // Can't route this event — acknowledge but skip processing
      return res.status(200).json({ received: true, skipped: true });
    }

    switch (event.type) {
      case 'charge.succeeded':
      case 'charge.refunded':
      case 'charge.failed': {
        const charge = event.data.object;
        await sb.from('transactions').upsert({
          org_id: orgId,
          source: 'stripe',
          external_id: charge.id,
          amount: charge.amount / 100,
          currency: charge.currency,
          status: charge.status,
          description: charge.description || '',
          date: new Date(charge.created * 1000).toISOString().split('T')[0],
          created_at: new Date(charge.created * 1000).toISOString(),
        }, { onConflict: 'org_id,source,external_id' });
        break;
      }

      case 'customer.created':
      case 'customer.updated': {
        const customer = event.data.object;
        await sb.from('contacts').upsert({
          org_id: orgId,
          source: 'stripe',
          external_id: customer.id,
          name: customer.name || customer.email || 'Sans nom',
          email: customer.email || '',
          phone: customer.phone || '',
          company: customer.metadata?.company || '',
          status: 'client',
          created_at: new Date(customer.created * 1000).toISOString(),
        }, { onConflict: 'org_id,source,external_id' });
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        await sb.from('transactions').upsert({
          org_id: orgId,
          source: 'stripe',
          external_id: pi.id,
          amount: pi.amount / 100,
          currency: pi.currency,
          status: 'succeeded',
          description: pi.description || '',
          date: new Date(pi.created * 1000).toISOString().split('T')[0],
          created_at: new Date(pi.created * 1000).toISOString(),
        }, { onConflict: 'org_id,source,external_id' });
        break;
      }

      default:
        // Acknowledge but don't process
        break;
    }

    // Log the sync event
    await sb.from('sync_history').insert({
      org_id: orgId,
      integration_name: 'stripe',
      action: 'webhook',
      details: `Processed ${event.type}`,
    });

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook-stripe]', err);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
}
