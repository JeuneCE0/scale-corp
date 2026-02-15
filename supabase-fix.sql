-- Run this in Supabase Dashboard > SQL Editor
-- Recreates societies and holding tables with JSONB storage

DROP TABLE IF EXISTS societies CASCADE;
CREATE TABLE societies (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_all_societies" ON societies FOR ALL USING (true);

DROP TABLE IF EXISTS holding CASCADE;
CREATE TABLE holding (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE holding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_all_holding" ON holding FOR ALL USING (true);
