CREATE TABLE public.dashboard_alert_acks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  metric_key text NOT NULL,
  acknowledged_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, metric_key)
);

CREATE INDEX idx_daa_user ON public.dashboard_alert_acks(user_id);

ALTER TABLE public.dashboard_alert_acks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own acks"
ON public.dashboard_alert_acks FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own acks"
ON public.dashboard_alert_acks FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own acks"
ON public.dashboard_alert_acks FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own acks"
ON public.dashboard_alert_acks FOR DELETE TO authenticated
USING (auth.uid() = user_id);