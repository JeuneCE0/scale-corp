-- HubScale — Sync Compatibility Migration
-- Adds columns and constraints required by the integration sync handlers
-- (api/integrations/sync.js) that are missing from the initial schema.
-- Run in Supabase SQL Editor or via supabase db push

-- ────────────────────────────────────────────────────────
-- 1. Transactions table (Stripe sync writes individual charges here)
--    financial_history stores period-based summaries (ca, charges, marge, treso)
--    transactions stores individual payment events from Stripe/PayPal/etc.
-- ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source text NOT NULL,          -- 'stripe' | 'paypal' | etc.
  external_id text NOT NULL,     -- provider's unique ID (e.g. ch_xxx)
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'eur',
  status text NOT NULL DEFAULT 'pending',  -- 'succeeded' | 'pending' | 'failed' | 'refunded'
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_org ON transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(org_id, source);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(org_id, created_at DESC);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select" ON transactions FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (org_id = auth_org_id());
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING (org_id = auth_org_id());
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING (org_id = auth_org_id());

-- Super admin access
CREATE POLICY "admin_transactions_select" ON transactions FOR SELECT USING (is_super_admin());

CREATE TRIGGER trg_transactions_updated BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────
-- 2. Events — add columns for Google Calendar sync
--    sync.js writes: start_at, end_at, location, metadata
--    existing schema has: date, time, end_time (no start_at/end_at/location/metadata)
-- ────────────────────────────────────────────────────────
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_at timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_at timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Unique constraint for external sync (prevent duplicate imports)
-- Only enforce when source and external_id are both set
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_source_external
  ON events(org_id, source, external_id)
  WHERE source IS NOT NULL AND external_id IS NOT NULL;

-- ────────────────────────────────────────────────────────
-- 3. Contacts — add columns for HubSpot sync
--    sync.js writes: first_name, last_name, external_id, metadata
--    and upserts on (org_id, source, external_id)
-- ────────────────────────────────────────────────────────
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Unique constraint for external sync (prevent duplicate imports)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_source_external
  ON contacts(org_id, source, external_id)
  WHERE source IS NOT NULL AND external_id IS NOT NULL;

-- ────────────────────────────────────────────────────────
-- 4. Backfill: populate first_name/last_name from name where possible
-- ────────────────────────────────────────────────────────
UPDATE contacts
SET
  first_name = CASE
    WHEN name LIKE '% %' THEN split_part(name, ' ', 1)
    ELSE name
  END,
  last_name = CASE
    WHEN name LIKE '% %' THEN substring(name FROM position(' ' IN name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL AND name IS NOT NULL;
