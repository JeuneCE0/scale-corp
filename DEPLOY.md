# Deployment & Custom Domain — HubScale / Scale Corp

## Architecture

This repo contains two separate Vercel deployments:

| App | Directory | Domain | Purpose |
|---|---|---|---|
| **Scale Corp** | `/` (root) | `scale-corp.vercel.app` → `app.scale-corp.fr` | Internal admin incubator dashboard |
| **HubScale** | `/hubscale/` | `hubscale.vercel.app` → `hubscale.app` | Customer-facing SaaS product |

## 1. Vercel Project Setup

### Scale Corp (root)
```bash
cd /path/to/scale-corp
vercel link           # link to your Vercel project
vercel env pull .env  # pull environment variables
vercel deploy         # deploy to preview
vercel --prod         # deploy to production
```

### HubScale (sub-directory)
```bash
cd /path/to/scale-corp/hubscale
vercel link           # link to a SEPARATE Vercel project
vercel env pull .env
vercel deploy
vercel --prod
```

> Each app must be a separate Vercel project because they have different `vite.config.js`, `package.json`, and API routes.

## 2. Custom Domain Configuration

### A. Purchase/Transfer Domain

Use your registrar (Namecheap, OVH, Gandi, Google Domains) to get:
- `scale-corp.fr` (for the admin app)
- `hubscale.app` (for the SaaS product)

### B. Add Domain in Vercel

For each Vercel project:

1. Go to **Project Settings > Domains**
2. Click **Add Domain**
3. Enter the custom domain (e.g. `hubscale.app`)
4. Vercel will show DNS records to configure

### C. Configure DNS Records

At your DNS registrar, add the records Vercel provides:

**Option 1 — CNAME (recommended for subdomains)**
```
Type: CNAME
Name: app (or www, or @)
Value: cname.vercel-dns.com.
TTL: 300
```

**Option 2 — A Record (for apex/root domain)**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 300
```

**Optional: www redirect**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com.
TTL: 300
```

### D. Verify & SSL

1. Wait for DNS propagation (usually 5–30 minutes, up to 48h)
2. Vercel auto-provisions a Let's Encrypt SSL certificate
3. Verify in **Project Settings > Domains** — should show a green checkmark

## 3. Environment Variables

### Vercel Environment Variables

Set these in each Vercel project under **Settings > Environment Variables**:

#### Scale Corp
See `.env.example` at the repo root for the full list. Key variables:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `GHL_ECO_KEY`, `GHL_LEADX_KEY`, etc. (per-location GHL API keys)
- `STRIPE_SECRET_KEY`, `STRIPE_CONNECT_CLIENT_ID`
- `ALLOWED_ORIGINS` (set to your custom domain)
- `VITE_SENTRY_DSN`

#### HubScale
See `hubscale/.env.example` for the full list. Key variables:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`
- `VITE_APP_URL` (set to your custom domain, e.g. `https://hubscale.app`)
- `VITE_SENTRY_DSN`
- `OAUTH_ENCRYPTION_KEY` (generate with `openssl rand -hex 32`)
- OAuth client IDs/secrets for Stripe, Google, HubSpot, Slack

### CORS Configuration

Update `ALLOWED_ORIGINS` to include your custom domain:
```
ALLOWED_ORIGINS=https://scale-corp.vercel.app,https://app.scale-corp.fr
```

## 4. Supabase Configuration

1. Run migrations in order:
   ```bash
   # In Supabase SQL Editor, run these in sequence:
   hubscale/supabase/migrations/001_initial_schema.sql
   hubscale/supabase/migrations/002_admin_panel.sql
   hubscale/supabase/migrations/003_sync_compatibility.sql
   ```

2. Update **Auth > URL Configuration** in Supabase Dashboard:
   - **Site URL**: `https://hubscale.app`
   - **Redirect URLs**: Add both `https://hubscale.app/*` and `https://hubscale.vercel.app/*`

3. Enable **Auth > Providers > Email** (with Confirm Email off for faster onboarding, or on for security)

## 5. Pre-Launch Checklist

- [ ] Custom domains configured and SSL active
- [ ] All env vars set in Vercel (both projects)
- [ ] Supabase migrations applied (001, 002, 003)
- [ ] Stripe products created + webhook configured (see `STRIPE_SETUP.md`)
- [ ] CORS origins updated to include custom domains
- [ ] Supabase auth redirect URLs updated
- [ ] Sentry DSN configured (`VITE_SENTRY_DSN`)
- [ ] Test login flow on production domain
- [ ] Test Stripe checkout + webhook on production
- [ ] Test OAuth integrations (Stripe Connect, Google Calendar, HubSpot, Slack)
