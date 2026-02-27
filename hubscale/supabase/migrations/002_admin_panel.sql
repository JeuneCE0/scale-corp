-- HubScale — Admin Panel Schema
-- Adds super_admin role and cross-org RLS policies for the admin panel

-- ─── Extend profiles role constraint to include super_admin ───
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'readonly', 'super_admin'));

-- ─── Helper: check if current user is a super_admin ───
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
$$;

-- ─── Admin audit log (separate from per-org audit_log) ───
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_log(admin_user_id, created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin audit log: only super_admins can read
CREATE POLICY "admin_audit_select" ON admin_audit_log
  FOR SELECT USING (is_super_admin());
CREATE POLICY "admin_audit_insert" ON admin_audit_log
  FOR INSERT WITH CHECK (is_super_admin());

-- ─── Cross-org RLS policies for super_admin ───

-- Organizations: super_admin can read and update all
CREATE POLICY "admin_org_select" ON organizations FOR SELECT USING (is_super_admin());
CREATE POLICY "admin_org_update" ON organizations FOR UPDATE USING (is_super_admin());

-- Profiles: super_admin can read and update all
CREATE POLICY "admin_profiles_select" ON profiles FOR SELECT USING (is_super_admin());
CREATE POLICY "admin_profiles_update" ON profiles FOR UPDATE USING (is_super_admin());

-- Contacts: super_admin can read all (for stats)
CREATE POLICY "admin_contacts_select" ON contacts FOR SELECT USING (is_super_admin());

-- Financial History: super_admin can read all
CREATE POLICY "admin_financial_select" ON financial_history FOR SELECT USING (is_super_admin());

-- Integrations: super_admin can read all
CREATE POLICY "admin_integrations_select" ON integrations FOR SELECT USING (is_super_admin());

-- Audit Log: super_admin can read all org audit logs
CREATE POLICY "admin_orgaudit_select" ON audit_log FOR SELECT USING (is_super_admin());

-- Notifications: super_admin can read all
CREATE POLICY "admin_notifications_select" ON notifications FOR SELECT USING (is_super_admin());
