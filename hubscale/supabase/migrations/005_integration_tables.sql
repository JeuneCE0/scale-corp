-- HubScale — Integration Tables Migration
-- Adds missing tables referenced by sync handlers: bank_accounts, deals, ad_insights
-- Adds missing date column on transactions
-- Run in Supabase SQL Editor or via supabase db push

-- ────────────────────────────────────────────────────────
-- 0. Helper function referenced by migration 003
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
$$;

-- ────────────────────────────────────────────────────────
-- 1. Transactions — add date column for Stripe/Revolut sync
-- ────────────────────────────────────────────────────────
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS date date;

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(org_id, date DESC);

-- Backfill date from created_at for existing rows
UPDATE transactions SET date = created_at::date WHERE date IS NULL;

-- ────────────────────────────────────────────────────────
-- 2. Bank Accounts (Revolut, Qonto account balances)
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source text NOT NULL,            -- 'revolut' | 'qonto'
  external_id text NOT NULL,       -- provider account ID
  name text NOT NULL DEFAULT 'Compte',
  balance numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_org ON bank_accounts(org_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_source ON bank_accounts(org_id, source);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_accounts_select" ON bank_accounts FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "bank_accounts_insert" ON bank_accounts FOR INSERT WITH CHECK (org_id = auth_org_id());
CREATE POLICY "bank_accounts_update" ON bank_accounts FOR UPDATE USING (org_id = auth_org_id());
CREATE POLICY "bank_accounts_delete" ON bank_accounts FOR DELETE USING (org_id = auth_org_id());

CREATE TRIGGER trg_bank_accounts_updated BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────
-- 3. Deals / Opportunities (GoHighLevel, Pipedrive, HubSpot)
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source text NOT NULL,            -- 'gohighlevel' | 'pipedrive' | 'hubspot'
  external_id text NOT NULL,       -- provider's opportunity/deal ID
  contact_external_id text,        -- linked contact external_id
  pipeline_name text,
  stage text,
  value numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',  -- 'open' | 'won' | 'lost' | 'abandoned'
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_deals_org ON deals(org_id);
CREATE INDEX IF NOT EXISTS idx_deals_source ON deals(org_id, source);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(org_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline ON deals(org_id, pipeline_name);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deals_select" ON deals FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "deals_insert" ON deals FOR INSERT WITH CHECK (org_id = auth_org_id());
CREATE POLICY "deals_update" ON deals FOR UPDATE USING (org_id = auth_org_id());
CREATE POLICY "deals_delete" ON deals FOR DELETE USING (org_id = auth_org_id());

CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────
-- 4. Ad Insights (Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads)
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source text NOT NULL,            -- 'meta_ads' | 'google_ads' | 'tiktok_ads'
  external_id text NOT NULL,       -- campaign_id + date composite key
  campaign_name text,
  campaign_id text,
  date date,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  spend numeric(12,2) NOT NULL DEFAULT 0,
  reach bigint DEFAULT 0,
  leads integer DEFAULT 0,
  conversions numeric(10,2) DEFAULT 0,
  revenue numeric(12,2) DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_insights_org ON ad_insights(org_id);
CREATE INDEX IF NOT EXISTS idx_ad_insights_source ON ad_insights(org_id, source);
CREATE INDEX IF NOT EXISTS idx_ad_insights_date ON ad_insights(org_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ad_insights_campaign ON ad_insights(org_id, source, campaign_id);

ALTER TABLE ad_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_insights_select" ON ad_insights FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "ad_insights_insert" ON ad_insights FOR INSERT WITH CHECK (org_id = auth_org_id());
CREATE POLICY "ad_insights_update" ON ad_insights FOR UPDATE USING (org_id = auth_org_id());
CREATE POLICY "ad_insights_delete" ON ad_insights FOR DELETE USING (org_id = auth_org_id());

CREATE TRIGGER trg_ad_insights_updated BEFORE UPDATE ON ad_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
