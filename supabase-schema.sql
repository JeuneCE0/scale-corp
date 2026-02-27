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
