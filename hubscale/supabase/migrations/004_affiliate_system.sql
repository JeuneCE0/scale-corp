-- HubScale — Affiliate System Tables
-- Tracks affiliate slugs, referral clicks, referrals, and payouts

-- ─── Affiliates (one per org, stores the slug) ───
create table if not exists affiliates (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  slug text not null unique,
  bank_info jsonb default null,
  total_earned numeric(12,2) not null default 0,
  total_paid numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Affiliate Clicks (server-side tracking) ───
create table if not exists affiliate_clicks (
  id uuid primary key default uuid_generate_v4(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  slug text not null,
  ip text default '',
  user_agent text default '',
  created_at timestamptz not null default now()
);

-- ─── Affiliate Referrals (who signed up via which affiliate) ───
create table if not exists affiliate_referrals (
  id uuid primary key default uuid_generate_v4(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  referred_org_id uuid references organizations(id) on delete set null,
  name text not null default '',
  email text not null default '',
  plan text default '',
  status text not null default 'pending' check (status in ('pending', 'active', 'churned')),
  sale_amount numeric(12,2) not null default 0,
  commission_earned numeric(12,2) not null default 0,
  potential_commission numeric(12,2) not null default 0,
  trial_ends_at timestamptz,
  first_charge_confirmed boolean not null default false,
  joined_at timestamptz not null default now(),
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Affiliate Payouts ───
create table if not exists affiliate_payouts (
  id uuid primary key default uuid_generate_v4(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid')),
  method text not null default 'bank_transfer',
  bank_info jsonb,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Indexes ───
create index if not exists idx_affiliates_org on affiliates(org_id);
create index if not exists idx_affiliates_slug on affiliates(slug);
create index if not exists idx_affiliate_clicks_affiliate on affiliate_clicks(affiliate_id);
create index if not exists idx_affiliate_clicks_slug on affiliate_clicks(slug);
create index if not exists idx_affiliate_referrals_affiliate on affiliate_referrals(affiliate_id);
create index if not exists idx_affiliate_referrals_email on affiliate_referrals(email);
create index if not exists idx_affiliate_payouts_affiliate on affiliate_payouts(affiliate_id);

-- ─── RLS ───
alter table affiliates enable row level security;
alter table affiliate_clicks enable row level security;
alter table affiliate_referrals enable row level security;
alter table affiliate_payouts enable row level security;

-- Affiliates: org members can see their own
create policy "affiliates_select" on affiliates for select using (org_id = auth_org_id());
create policy "affiliates_insert" on affiliates for insert with check (org_id = auth_org_id());
create policy "affiliates_update" on affiliates for update using (org_id = auth_org_id());

-- Clicks: insert is public (no auth needed for tracking), select scoped to affiliate owner
create policy "clicks_insert" on affiliate_clicks for insert with check (true);
create policy "clicks_select" on affiliate_clicks for select using (
  affiliate_id in (select id from affiliates where org_id = auth_org_id())
);

-- Referrals: insert is public (checkout creates them), select scoped to affiliate owner
create policy "referrals_insert" on affiliate_referrals for insert with check (true);
create policy "referrals_select" on affiliate_referrals for select using (
  affiliate_id in (select id from affiliates where org_id = auth_org_id())
);
create policy "referrals_update" on affiliate_referrals for update using (
  affiliate_id in (select id from affiliates where org_id = auth_org_id())
);

-- Payouts: scoped to affiliate owner
create policy "payouts_select" on affiliate_payouts for select using (
  affiliate_id in (select id from affiliates where org_id = auth_org_id())
);
create policy "payouts_insert" on affiliate_payouts for insert with check (
  affiliate_id in (select id from affiliates where org_id = auth_org_id())
);

-- ─── Triggers ───
create trigger trg_affiliates_updated before update on affiliates for each row execute function update_updated_at();
create trigger trg_affiliate_referrals_updated before update on affiliate_referrals for each row execute function update_updated_at();
create trigger trg_affiliate_payouts_updated before update on affiliate_payouts for each row execute function update_updated_at();
