-- L'INCUBATEUR ECS — Supabase Schema

-- Users / Auth
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text,
  role text default 'porteur', -- admin, porteur
  society_id text,
  pin_hash text,
  created_at timestamptz default now()
);

-- Societies (companies managed)
create table if not exists public.societies (
  id text primary key,
  nom text not null,
  porteur text,
  color text default '#FFAA00',
  brand_color text,
  brand_color_secondary text,
  logo_url text,
  ghl_location_id text,
  revolut_account_id text,
  monthly_goal numeric default 0,
  pin text,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Client data overrides (billing, categories, notes)
create table if not exists public.client_data (
  id uuid primary key default gen_random_uuid(),
  society_id text references public.societies(id),
  ghl_contact_id text,
  billing jsonb, -- {type, amount, percent, base}
  domain text,
  notes text,
  tags text[],
  resources jsonb default '[]', -- [{title, url, type}]
  onboarding jsonb default '{}', -- checklist state
  custom_category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(society_id, ghl_contact_id)
);

-- Meta Ads data (monthly)
create table if not exists public.meta_ads (
  id uuid primary key default gen_random_uuid(),
  society_id text references public.societies(id),
  month text not null, -- YYYY-MM
  spend numeric default 0,
  impressions integer default 0,
  clicks integer default 0,
  leads integer default 0,
  revenue numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(society_id, month)
);

-- Sales data (monthly manual inputs)
create table if not exists public.sales_data (
  id uuid primary key default gen_random_uuid(),
  society_id text references public.societies(id),
  month text not null, -- YYYY-MM
  no_show_count integer default 0,
  objections jsonb default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(society_id, month)
);

-- Monthly reports (auto-generated + editable)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  society_id text references public.societies(id),
  month text not null, -- YYYY-MM
  ca numeric default 0,
  charges numeric default 0,
  marge numeric default 0,
  tresorerie numeric default 0,
  notes text,
  data jsonb default '{}', -- full report data
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(society_id, month)
);

-- Transaction categories (manual overrides)
create table if not exists public.tx_categories (
  id uuid primary key default gen_random_uuid(),
  society_id text references public.societies(id),
  tx_id text not null,
  category text,
  created_at timestamptz default now(),
  unique(society_id, tx_id)
);

-- User settings (todo completions, streaks, preferences)
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  society_id text references public.societies(id),
  key text not null,
  value jsonb,
  updated_at timestamptz default now(),
  unique(society_id, key)
);

-- Holding config
create table if not exists public.holding (
  id text primary key default 'main',
  config jsonb default '{}',
  brand jsonb default '{}',
  updated_at timestamptz default now()
);

-- API OAuth tokens (for GHL, Revolut, Qonto, Meta Ads, Google Ads, TikTok, Stripe)
create table if not exists public.api_tokens (
  id text primary key, -- e.g. "meta_leadx", "ghl_eco"
  provider text not null, -- ghl, revolut, qonto, meta, google_ads, tiktok, stripe
  society_id text references public.societies(id),
  access_token text,
  refresh_token text,
  token_type text default 'Bearer',
  expires_at timestamptz,
  scopes text,
  location_id text, -- GHL location ID
  company_id text, -- Revolut company / generic company ref
  raw_metadata jsonb default '{}', -- full token response for provider-specific data
  connected_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ad attribution data (cross-platform, monthly aggregates synced from APIs)
create table if not exists public.ad_attribution (
  id uuid primary key default gen_random_uuid(),
  society_id text references public.societies(id),
  month text not null, -- YYYY-MM
  platform text not null, -- meta, google, tiktok
  spend numeric default 0,
  impressions integer default 0,
  clicks integer default 0,
  leads integer default 0,
  conversions integer default 0,
  revenue numeric default 0,
  roas numeric default 0,
  cpl numeric default 0,
  cpa numeric default 0,
  ctr numeric default 0,
  raw_data jsonb default '{}', -- full API response for drill-down
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(society_id, month, platform)
);

-- Affiliate link clicks (server-side tracking)
create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  society_id text references public.societies(id),
  ref_code text not null,
  referrer_client_id text default '',
  ip text default '',
  user_agent text default '',
  created_at timestamptz default now()
);

-- Affiliate pending referrals (leads captured from affiliate links, awaiting client match)
create table if not exists public.affiliate_pending_referrals (
  id uuid primary key default gen_random_uuid(),
  society_id text references public.societies(id),
  ref_code text not null,
  referrer_client_id text not null,
  lead_name text default '',
  lead_email text default '',
  lead_phone text default '',
  status text default 'pending',        -- pending, matched, expired
  matched_client_id text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Affiliate referrals (tracks each referral: who referred whom)
create table if not exists public.affiliate_referrals (
  id uuid primary key default gen_random_uuid(),
  society_id text references public.societies(id),
  referrer_client_id text not null,       -- the affiliate who referred
  referred_client_id text not null,        -- the new client
  ref_code text not null,                  -- referral code used
  status text default 'pending',           -- pending, active, churned
  revenue numeric default 0,              -- total revenue generated by referred client
  commission numeric default 0,           -- commission earned (revenue * rate)
  commission_rate numeric default 0.20,   -- rate at time of referral (20%)
  converted_at timestamptz,               -- when the referral converted to active
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  referred_name text default '',
  unique(society_id, referred_client_id)
);

-- Affiliate commissions (monthly commission snapshots for accounting)
create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  society_id text references public.societies(id),
  referral_id uuid references public.affiliate_referrals(id),
  affiliate_client_id text not null,       -- the affiliate earning the commission
  referred_client_id text not null,
  month text not null,                     -- YYYY-MM
  revenue numeric default 0,              -- revenue that month from the referred client
  commission numeric default 0,           -- commission for that month
  commission_rate numeric default 0.20,
  status text default 'pending',           -- pending (in holding), confirmed, paid
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(society_id, referral_id, month)
);

-- Affiliate payouts (payout requests and their processing status)
create table if not exists public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  society_id text references public.societies(id),
  affiliate_client_id text not null,
  amount numeric not null,
  status text default 'pending',           -- pending, processing, paid, rejected
  method text default 'bank_transfer',
  bank_info jsonb,                         -- {firstName, lastName, iban, bic, ...}
  requested_at timestamptz default now(),
  processed_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.api_tokens enable row level security;
alter table public.ad_attribution enable row level security;
alter table public.users enable row level security;
alter table public.societies enable row level security;
alter table public.client_data enable row level security;
alter table public.meta_ads enable row level security;
alter table public.sales_data enable row level security;
alter table public.reports enable row level security;
alter table public.tx_categories enable row level security;
alter table public.user_settings enable row level security;
alter table public.holding enable row level security;

alter table public.affiliate_clicks enable row level security;
alter table public.affiliate_pending_referrals enable row level security;
alter table public.affiliate_referrals enable row level security;
alter table public.affiliate_commissions enable row level security;
alter table public.affiliate_payouts enable row level security;

-- For now, allow all access via service key (we'll tighten later)
create policy "Allow all via service key" on public.users for all using (true);
create policy "Allow all via service key" on public.societies for all using (true);
create policy "Allow all via service key" on public.client_data for all using (true);
create policy "Allow all via service key" on public.meta_ads for all using (true);
create policy "Allow all via service key" on public.sales_data for all using (true);
create policy "Allow all via service key" on public.reports for all using (true);
create policy "Allow all via service key" on public.tx_categories for all using (true);
create policy "Allow all via service key" on public.user_settings for all using (true);
create policy "Allow all via service key" on public.holding for all using (true);
create policy "Allow all via service key" on public.api_tokens for all using (true);
create policy "Allow all via service key" on public.ad_attribution for all using (true);
create policy "Allow all via service key" on public.affiliate_clicks for all using (true);
create policy "Allow all via service key" on public.affiliate_pending_referrals for all using (true);
create policy "Allow all via service key" on public.affiliate_referrals for all using (true);
create policy "Allow all via service key" on public.affiliate_commissions for all using (true);
create policy "Allow all via service key" on public.affiliate_payouts for all using (true);

-- ============================================================================
-- SCHEMA ADDITIONS: Performance indexes, CHECK constraints, NOT NULL constraints
-- Added 2026-03-22 — appended as non-breaking changes (no existing DDL modified)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Performance indexes for common query patterns
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_society_created ON public.affiliate_clicks(society_id, created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referrer ON public.affiliate_referrals(referrer_client_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_month ON public.affiliate_commissions(affiliate_client_id, month);
CREATE INDEX IF NOT EXISTS idx_api_tokens_provider_society ON public.api_tokens(provider, society_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_society_month ON public.meta_ads(society_id, month);
CREATE INDEX IF NOT EXISTS idx_sales_data_society_month ON public.sales_data(society_id, month);
CREATE INDEX IF NOT EXISTS idx_client_data_society ON public.client_data(society_id);
CREATE INDEX IF NOT EXISTS idx_transactions_society ON public.transactions(society_id);

-- ---------------------------------------------------------------------------
-- 2. CHECK constraints for data validation (idempotent with exception handling)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE public.societies ADD CONSTRAINT chk_monthly_goal_positive CHECK (monthly_goal >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.affiliate_commissions ADD CONSTRAINT chk_commission_rate_valid CHECK (commission_rate > 0 AND commission_rate <= 1);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.affiliate_payouts ADD CONSTRAINT chk_payout_amount_positive CHECK (amount > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 3. NOT NULL constraints on critical foreign keys (idempotent with exception handling)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE public.client_data ALTER COLUMN society_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.transactions ALTER COLUMN society_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Rename societies.pin to pin_hash for consistency (migration)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='societies' AND column_name='pin') THEN
    ALTER TABLE public.societies RENAME COLUMN pin TO pin_hash;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Cascade deletes for dependent tables (avoid orphaned data)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  -- When a society is deleted, remove its data
  ALTER TABLE public.client_data DROP CONSTRAINT IF EXISTS client_data_society_id_fkey;
  ALTER TABLE public.client_data ADD CONSTRAINT client_data_society_id_fkey
    FOREIGN KEY (society_id) REFERENCES public.societies(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_society_id_fkey;
  ALTER TABLE public.transactions ADD CONSTRAINT transactions_society_id_fkey
    FOREIGN KEY (society_id) REFERENCES public.societies(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.sales_data DROP CONSTRAINT IF EXISTS sales_data_society_id_fkey;
  ALTER TABLE public.sales_data ADD CONSTRAINT sales_data_society_id_fkey
    FOREIGN KEY (society_id) REFERENCES public.societies(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL;
END $$;
