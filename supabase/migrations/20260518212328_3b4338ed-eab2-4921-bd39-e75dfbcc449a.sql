CREATE TABLE public.user_dashboard_prefs (
  user_id UUID NOT NULL PRIMARY KEY,
  kpis TEXT[] NOT NULL DEFAULT '{}',
  charts TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_dashboard_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own dashboard prefs" ON public.user_dashboard_prefs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own dashboard prefs" ON public.user_dashboard_prefs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own dashboard prefs" ON public.user_dashboard_prefs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own dashboard prefs" ON public.user_dashboard_prefs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_user_dashboard_prefs_updated_at
  BEFORE UPDATE ON public.user_dashboard_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();