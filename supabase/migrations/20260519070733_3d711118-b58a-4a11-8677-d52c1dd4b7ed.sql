ALTER TABLE public.dashboard_alert_history
  ADD COLUMN assigned_to uuid,
  ADD COLUMN assigned_department_id uuid,
  ADD COLUMN action_status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN action_notes text,
  ADD COLUMN assigned_at timestamptz,
  ADD COLUMN resolved_at timestamptz;

CREATE INDEX idx_dah_assigned_to ON public.dashboard_alert_history(assigned_to);
CREATE INDEX idx_dah_status ON public.dashboard_alert_history(action_status);

-- Allow update by owner, assignee, admin or diretor
CREATE POLICY "Owner assignee admin or diretor can update alert"
ON public.dashboard_alert_history FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR auth.uid() = assigned_to
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'diretor'::app_role)
);

-- Also allow assignee to see alerts assigned to them
DROP POLICY IF EXISTS "Users view own alert history" ON public.dashboard_alert_history;
CREATE POLICY "View own or assigned alert history"
ON public.dashboard_alert_history FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR auth.uid() = assigned_to
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'diretor'::app_role)
);