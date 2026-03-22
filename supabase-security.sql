-- Scale Corp — RLS Security Hardening
-- Run this in Supabase SQL Editor to lock down direct access
-- Only service_role (our Vercel serverless functions) can access tables

-- Drop permissive policies
DROP POLICY IF EXISTS "allow_all" ON public.users;
DROP POLICY IF EXISTS "allow_all" ON public.societies;
DROP POLICY IF EXISTS "allow_all" ON public.client_data;
DROP POLICY IF EXISTS "allow_all" ON public.meta_ads;
DROP POLICY IF EXISTS "allow_all" ON public.sales_data;
DROP POLICY IF EXISTS "allow_all" ON public.reports;
DROP POLICY IF EXISTS "allow_all" ON public.tx_categories;
DROP POLICY IF EXISTS "allow_all" ON public.user_settings;
DROP POLICY IF EXISTS "allow_all" ON public.holding;

-- Only service_role can access (our serverless functions use service key)
CREATE POLICY "service_only" ON public.users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only" ON public.societies FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only" ON public.client_data FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only" ON public.meta_ads FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only" ON public.sales_data FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only" ON public.reports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only" ON public.tx_categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only" ON public.user_settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only" ON public.holding FOR ALL USING (auth.role() = 'service_role');

-- Affiliate & API tables
DROP POLICY IF EXISTS "allow_all" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "allow_all" ON public.affiliate_pending_referrals;
DROP POLICY IF EXISTS "allow_all" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "allow_all" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "allow_all" ON public.affiliate_payouts;
DROP POLICY IF EXISTS "allow_all" ON public.api_tokens;
DROP POLICY IF EXISTS "allow_all" ON public.ad_attribution;

CREATE POLICY "service_only" ON public.affiliate_clicks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only" ON public.affiliate_pending_referrals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only" ON public.affiliate_referrals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only" ON public.affiliate_commissions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only" ON public.affiliate_payouts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only" ON public.api_tokens FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only" ON public.ad_attribution FOR ALL USING (auth.role() = 'service_role');
