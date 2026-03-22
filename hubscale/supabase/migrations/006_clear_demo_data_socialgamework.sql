-- Migration: Clear demo data for socialgameworkofficiel@gmail.com
-- This removes all demo/sample data from the account while preserving the organization, profile, and preferences.

DO $$
DECLARE
  target_org_id uuid;
  target_email text := 'socialgameworkofficiel@gmail.com';
BEGIN
  -- Find the org_id for this user
  SELECT org_id INTO target_org_id FROM profiles WHERE email = target_email LIMIT 1;

  IF target_org_id IS NULL THEN
    RAISE NOTICE 'No user found with email %, skipping.', target_email;
    RETURN;
  END IF;

  RAISE NOTICE 'Clearing demo data for org_id: %', target_org_id;

  -- Delete contact comments first (references contacts)
  DELETE FROM contact_comments WHERE org_id = target_org_id;

  -- Delete contacts
  DELETE FROM contacts WHERE org_id = target_org_id;

  -- Delete financial history
  DELETE FROM financial_history WHERE org_id = target_org_id;

  -- Delete events
  DELETE FROM events WHERE org_id = target_org_id;

  -- Delete sync history
  DELETE FROM sync_history WHERE org_id = target_org_id;

  -- Delete notifications
  DELETE FROM notifications WHERE org_id = target_org_id;

  -- Delete transactions
  DELETE FROM transactions WHERE org_id = target_org_id;

  -- Delete bank accounts
  DELETE FROM bank_accounts WHERE org_id = target_org_id;

  -- Delete deals
  DELETE FROM deals WHERE org_id = target_org_id;

  -- Delete ad insights
  DELETE FROM ad_insights WHERE org_id = target_org_id;

  -- Reset integrations (disconnect but keep entries)
  UPDATE integrations
  SET connected = false,
      access_token_enc = NULL,
      refresh_token_enc = NULL,
      last_synced_at = NULL
  WHERE org_id = target_org_id;

  -- Clear affiliate data
  DELETE FROM affiliate_payouts WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE org_id = target_org_id
  );
  DELETE FROM affiliate_referrals WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE org_id = target_org_id
  );
  DELETE FROM affiliate_clicks WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE org_id = target_org_id
  );
  DELETE FROM affiliates WHERE org_id = target_org_id;

  -- Log the action in audit_log
  INSERT INTO audit_log (org_id, action, entity_type, entity_id, details)
  VALUES (target_org_id, 'admin_clear_demo_data', 'organization', target_org_id,
    jsonb_build_object('email', target_email, 'reason', 'Remove demo data from production account'));

  RAISE NOTICE 'Demo data cleared successfully for %', target_email;
END $$;
