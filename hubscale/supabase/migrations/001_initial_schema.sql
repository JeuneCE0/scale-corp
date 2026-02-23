-- HubScale — Initial Database Schema
-- Run in Supabase SQL Editor or via supabase db push

-- ─── Enable extensions ───
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Organizations (multi-tenant root) ───
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sector text,
  website text,
  logo_url text,
  plan text not null default 'starter',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Profiles (linked to auth.users) ───
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  email text not null,
  avatar_url text,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'readonly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Contacts (CRM) ───
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  status text not null default 'prospect' check (status in ('prospect', 'lead', 'client', 'perdu', 'partenaire')),
  lead_score integer not null default 0 check (lead_score >= 0 and lead_score <= 100),
  source text,
  ca numeric(12,2) not null default 0,
  notes text,
  tags text[] default '{}',
  last_contact_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Contact Comments ───
create table if not exists contact_comments (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid not null references contacts(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

-- ─── Financial History ───
create table if not exists financial_history (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  period_key text not null, -- e.g. '2025-01'
  ca numeric(12,2) not null default 0,
  charges numeric(12,2) not null default 0,
  marge numeric(12,2) not null default 0,
  treso numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, period_key)
);

-- ─── Events (Agenda) ───
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  time text, -- e.g. '14:30'
  end_time text,
  type text not null default 'event' check (type in ('reunion', 'deadline', 'call', 'event')),
  source text, -- 'manual' | 'google_calendar' | etc.
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Integrations State ───
create table if not exists integrations (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  connected boolean not null default false,
  access_token_enc text, -- encrypted OAuth token
  refresh_token_enc text,
  token_expires_at timestamptz,
  metadata jsonb default '{}',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

-- ─── Sync History (integration activity log) ───
create table if not exists sync_history (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  integration_name text not null,
  action text not null, -- 'connect' | 'disconnect' | 'sync' | 'error'
  details text,
  created_at timestamptz not null default now()
);

-- ─── Notifications ───
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  message text not null,
  data jsonb default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── Audit Log ───
create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb default '{}',
  ip_address inet,
  created_at timestamptz not null default now()
);

-- ─── User Preferences ───
create table if not exists user_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  theme text not null default 'dark',
  lang text not null default 'fr',
  onboarded boolean not null default false,
  tour_done boolean not null default false,
  notif_dismissed text[] default '{}',
  widget_order text[] default '{}',
  updated_at timestamptz not null default now()
);

-- ─── INDEXES ───
create index if not exists idx_contacts_org on contacts(org_id);
create index if not exists idx_contacts_status on contacts(org_id, status);
create index if not exists idx_contacts_score on contacts(org_id, lead_score desc);
create index if not exists idx_financial_org on financial_history(org_id);
create index if not exists idx_financial_period on financial_history(org_id, period_key);
create index if not exists idx_events_org on events(org_id);
create index if not exists idx_events_date on events(org_id, date);
create index if not exists idx_integrations_org on integrations(org_id);
create index if not exists idx_sync_history_org on sync_history(org_id, created_at desc);
create index if not exists idx_notifications_user on notifications(user_id, read, created_at desc);
create index if not exists idx_audit_log_org on audit_log(org_id, created_at desc);
create index if not exists idx_profiles_org on profiles(org_id);

-- ─── ROW LEVEL SECURITY ───

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table contacts enable row level security;
alter table contact_comments enable row level security;
alter table financial_history enable row level security;
alter table events enable row level security;
alter table integrations enable row level security;
alter table sync_history enable row level security;
alter table notifications enable row level security;
alter table audit_log enable row level security;
alter table user_preferences enable row level security;

-- Helper: get current user's org_id
create or replace function auth_org_id()
returns uuid
language sql
stable
security definer
as $$
  select org_id from profiles where id = auth.uid()
$$;

-- Organizations: users can only see their own org
create policy "org_select" on organizations for select using (id = auth_org_id());
create policy "org_update" on organizations for update using (id = auth_org_id());

-- Profiles: users can see members of their org
create policy "profiles_select" on profiles for select using (org_id = auth_org_id());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- Contacts: scoped to org
create policy "contacts_select" on contacts for select using (org_id = auth_org_id());
create policy "contacts_insert" on contacts for insert with check (org_id = auth_org_id());
create policy "contacts_update" on contacts for update using (org_id = auth_org_id());
create policy "contacts_delete" on contacts for delete using (org_id = auth_org_id());

-- Contact Comments: scoped to org
create policy "comments_select" on contact_comments for select using (org_id = auth_org_id());
create policy "comments_insert" on contact_comments for insert with check (org_id = auth_org_id());
create policy "comments_delete" on contact_comments for delete using (org_id = auth_org_id());

-- Financial History: scoped to org
create policy "fin_select" on financial_history for select using (org_id = auth_org_id());
create policy "fin_insert" on financial_history for insert with check (org_id = auth_org_id());
create policy "fin_update" on financial_history for update using (org_id = auth_org_id());
create policy "fin_delete" on financial_history for delete using (org_id = auth_org_id());

-- Events: scoped to org
create policy "events_select" on events for select using (org_id = auth_org_id());
create policy "events_insert" on events for insert with check (org_id = auth_org_id());
create policy "events_update" on events for update using (org_id = auth_org_id());
create policy "events_delete" on events for delete using (org_id = auth_org_id());

-- Integrations: scoped to org
create policy "integrations_select" on integrations for select using (org_id = auth_org_id());
create policy "integrations_insert" on integrations for insert with check (org_id = auth_org_id());
create policy "integrations_update" on integrations for update using (org_id = auth_org_id());
create policy "integrations_delete" on integrations for delete using (org_id = auth_org_id());

-- Sync History: read-only for org members
create policy "sync_select" on sync_history for select using (org_id = auth_org_id());
create policy "sync_insert" on sync_history for insert with check (org_id = auth_org_id());

-- Notifications: user can see their own (or org-wide where user_id is null)
create policy "notif_select" on notifications for select using (org_id = auth_org_id() and (user_id = auth.uid() or user_id is null));
create policy "notif_update" on notifications for update using (org_id = auth_org_id() and (user_id = auth.uid() or user_id is null));
create policy "notif_insert" on notifications for insert with check (org_id = auth_org_id());

-- Audit Log: read-only for org admins
create policy "audit_select" on audit_log for select using (
  org_id = auth_org_id()
  and exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin'))
);
create policy "audit_insert" on audit_log for insert with check (org_id = auth_org_id());

-- User Preferences: own only
create policy "prefs_select" on user_preferences for select using (user_id = auth.uid());
create policy "prefs_insert" on user_preferences for insert with check (user_id = auth.uid());
create policy "prefs_update" on user_preferences for update using (user_id = auth.uid());

-- ─── TRIGGERS: auto-update updated_at ───
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_organizations_updated before update on organizations for each row execute function update_updated_at();
create trigger trg_profiles_updated before update on profiles for each row execute function update_updated_at();
create trigger trg_contacts_updated before update on contacts for each row execute function update_updated_at();
create trigger trg_financial_updated before update on financial_history for each row execute function update_updated_at();
create trigger trg_events_updated before update on events for each row execute function update_updated_at();
create trigger trg_integrations_updated before update on integrations for each row execute function update_updated_at();
create trigger trg_prefs_updated before update on user_preferences for each row execute function update_updated_at();
