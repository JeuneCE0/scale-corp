-- Data Lineage Logs — Architecture Médaillon (Bronze / Silver / Gold)
-- Permet de tracer chaque étape du pipeline de données,
-- du point d'entrée (API externe) au résultat final (dashboard)

CREATE TABLE IF NOT EXISTS public.data_lineage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id text,                          -- null = holding / global
  layer text NOT NULL CHECK (layer IN ('bronze','silver','gold')),
  source text NOT NULL,                     -- 'ghl', 'revolut', 'stripe', 'manual', 'system'
  pipeline text NOT NULL,                   -- 'sync_ghl', 'sync_revolut', 'sync_stripe', 'auto_report', 'manual_report', 'calc_holding'
  step text NOT NULL,                       -- 'fetch', 'transform', 'categorize', 'aggregate', 'store', 'render'
  status text DEFAULT 'success' CHECK (status IN ('success','error','warning','skipped')),
  records_in integer DEFAULT 0,
  records_out integer DEFAULT 0,
  duration_ms integer DEFAULT 0,
  details jsonb DEFAULT '{}',               -- metadata contextuelle (ex: mois, endpoint, champs calculés)
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Index pour les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_lineage_society ON public.data_lineage_logs(society_id);
CREATE INDEX IF NOT EXISTS idx_lineage_layer ON public.data_lineage_logs(layer);
CREATE INDEX IF NOT EXISTS idx_lineage_created ON public.data_lineage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lineage_pipeline ON public.data_lineage_logs(pipeline);

-- RLS
ALTER TABLE public.data_lineage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all via service key" ON public.data_lineage_logs FOR ALL USING (true);

-- Nettoyage automatique des logs > 30 jours (à lancer via cron ou manuellement)
-- DELETE FROM public.data_lineage_logs WHERE created_at < now() - interval '30 days';
