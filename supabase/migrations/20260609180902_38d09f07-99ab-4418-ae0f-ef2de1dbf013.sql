
-- Workflow fields on employee_evaluations
ALTER TABLE public.employee_evaluations
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;

-- History table
CREATE TABLE IF NOT EXISTS public.evaluation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.employee_evaluations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  from_status text,
  to_status text,
  comment text,
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.evaluation_history TO authenticated;
GRANT ALL ON public.evaluation_history TO service_role;

ALTER TABLE public.evaluation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eval_history_select" ON public.evaluation_history
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employee_evaluations e
    WHERE e.id = evaluation_history.evaluation_id
      AND (public.is_admin() OR public.has_role(auth.uid(),'gestor')
           OR public.has_role(auth.uid(),'diretor')
           OR e.employee_id = auth.uid() OR e.evaluator_id = auth.uid())
  ));

CREATE POLICY "eval_history_insert" ON public.evaluation_history
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_eval_history_eval ON public.evaluation_history(evaluation_id, created_at DESC);

-- Auto-log status changes via trigger
CREATE OR REPLACE FUNCTION public.log_evaluation_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.evaluation_history(evaluation_id, actor_id, action, from_status, to_status)
    VALUES (NEW.id, auth.uid(), 'criada', NULL, NEW.status);
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    v_action := CASE NEW.status
      WHEN 'submetida' THEN 'submetida'
      WHEN 'aprovada' THEN 'aprovada'
      WHEN 'rejeitada' THEN 'rejeitada'
      WHEN 'validada' THEN 'validada'
      WHEN 'rascunho' THEN 'reaberta'
      ELSE 'alteracao_estado'
    END;
    INSERT INTO public.evaluation_history(evaluation_id, actor_id, action, from_status, to_status, comment)
    VALUES (NEW.id, auth.uid(), v_action, OLD.status, NEW.status, NEW.rejection_reason);
  ELSIF NEW.global_score IS DISTINCT FROM OLD.global_score
     OR NEW.strengths IS DISTINCT FROM OLD.strengths
     OR NEW.improvements IS DISTINCT FROM OLD.improvements
     OR NEW.general_comments IS DISTINCT FROM OLD.general_comments THEN
    INSERT INTO public.evaluation_history(evaluation_id, actor_id, action, from_status, to_status, changes)
    VALUES (NEW.id, auth.uid(), 'editada', OLD.status, NEW.status,
      jsonb_build_object(
        'global_score', jsonb_build_array(OLD.global_score, NEW.global_score),
        'strengths_changed', OLD.strengths IS DISTINCT FROM NEW.strengths,
        'improvements_changed', OLD.improvements IS DISTINCT FROM NEW.improvements,
        'comments_changed', OLD.general_comments IS DISTINCT FROM NEW.general_comments
      ));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_eval_history_ins ON public.employee_evaluations;
DROP TRIGGER IF EXISTS trg_eval_history_upd ON public.employee_evaluations;
CREATE TRIGGER trg_eval_history_ins AFTER INSERT ON public.employee_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.log_evaluation_change();
CREATE TRIGGER trg_eval_history_upd AFTER UPDATE ON public.employee_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.log_evaluation_change();

-- Update RLS for approval workflow: diretor/admin can approve; lock edits once approved/validated
DROP POLICY IF EXISTS "emp_eval_update" ON public.employee_evaluations;
CREATE POLICY "emp_eval_update" ON public.employee_evaluations
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR public.has_role(auth.uid(),'diretor')
    OR (public.has_role(auth.uid(),'gestor') AND status IN ('rascunho','submetida','rejeitada'))
    OR (evaluator_id = auth.uid() AND status IN ('rascunho','rejeitada'))
    OR (employee_id = auth.uid() AND status = 'aprovada' AND acknowledged_at IS NULL)
  );
