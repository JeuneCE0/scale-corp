# Stripe Setup Guide — HubScale

## 1. Create Stripe Products & Prices

In the Stripe Dashboard (https://dashboard.stripe.com):

1. **Products > + Add product** for each plan:
   - **Starter** — 49 €/mois récurrent
   - **Professional** — 149 €/mois récurrent
   - **Enterprise** — 349 €/mois récurrent

2. Copy each price ID (`price_xxx`) into your `.env`:
   ```
   STRIPE_PRICE_STARTER=price_xxx
   STRIPE_PRICE_PROFESSIONAL=price_xxx
   STRIPE_PRICE_ENTERPRISE=price_xxx
   ```

## 2. Configure Environment Variables

```bash
# Stripe secret key (from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_...

# Stripe Connect client ID (if using Connect for marketplace payouts)
STRIPE_CONNECT_CLIENT_ID=ca_...

# Webhook signing secret (from step 3 below)
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs for each plan
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_ENTERPRISE=price_...

# App URL for checkout return/cancel URLs
VITE_APP_URL=https://hubscale.app
```

## 3. Configure Webhook Endpoint

In Stripe Dashboard > Developers > Webhooks:

1. Click **+ Add endpoint**
2. **Endpoint URL**: `https://hubscale.app/api/billing` (or your Vercel domain)
3. **Events to send** — select these 3 events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Click **Add endpoint**
5. Copy the **Signing secret** (`whsec_...`) to `STRIPE_WEBHOOK_SECRET` in your `.env`

## 4. Webhook Handler Reference

The billing handler (`hubscale/api/billing.js`) processes:

| Event | Action |
|---|---|
| `checkout.session.completed` | Creates/updates org's `stripe_subscription_id`, sets `plan`, logs to `audit_log` |
| `customer.subscription.updated` | Updates org's `plan` based on active price ID |
| `customer.subscription.deleted` | Resets org to `plan: 'starter'`, clears subscription ID |

### Verification Checklist

- [x] Webhook signature verification via `stripe.webhooks.constructEvent()`
- [x] Checkout session creates Stripe customer on `organizations.stripe_customer_id`
- [x] Plan mapping: price ID → plan name (`starter`/`professional`/`enterprise`)
- [x] Subscription cancellation gracefully downgrades to starter
- [x] Audit log entry on plan changes
- [x] Billing portal support for self-service management
- [x] Error handling returns 400 on invalid signatures

### Missing (non-blocking for launch):

- [ ] Email notification on plan change (implement via Resend when ready)
- [ ] Trial period support (add `trial_period_days` to checkout session if needed)
- [ ] Usage-based billing (not needed for flat-rate plans)

## 5. Test the Flow

1. Use Stripe CLI to forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/billing
   ```

2. Trigger a test checkout:
   ```bash
   stripe trigger checkout.session.completed
   ```

3. Verify in Supabase that `organizations.plan` was updated.

## 6. Go Live

1. Switch from `sk_test_` to `sk_live_` keys
2. Update webhook endpoint URL to production domain
3. Remove test mode flag from checkout session if present
