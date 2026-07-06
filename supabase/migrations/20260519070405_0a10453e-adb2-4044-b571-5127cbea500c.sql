CREATE TABLE public.dashboard_alert_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  metric_key text NOT NULL,
  label text NOT NULL,
  value numeric NOT NULL,
  threshold numeric NOT NULL,
  tone text NOT NULL DEFAULT 'warning',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dah_user_created ON public.dashboard_alert_history(user_id, created_at DESC);
CREATE INDEX idx_dah_metric ON public.dashboard_alert_history(metric_key);

ALTER TABLE public.dashboard_alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own alert history"
ON public.dashboard_alert_history FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'diretor'::app_role));

CREATE POLICY "Users insert own alert history"
ON public.dashboard_alert_history FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own alert history"
ON public.dashboard_alert_history FOR DELETE TO authenticated
USING (auth.uid() = user_id OR is_admin());