ALTER TABLE public.user_dashboard_prefs
  ADD COLUMN IF NOT EXISTS thresholds JSONB NOT NULL DEFAULT '{}'::jsonb;