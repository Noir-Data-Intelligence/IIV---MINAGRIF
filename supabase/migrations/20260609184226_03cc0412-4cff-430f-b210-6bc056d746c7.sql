DROP POLICY IF EXISTS emp_eval_update ON public.employee_evaluations;

CREATE POLICY emp_eval_update ON public.employee_evaluations
FOR UPDATE TO authenticated
USING (
  is_admin()
  OR has_role(auth.uid(), 'diretor'::app_role)
  OR (has_role(auth.uid(), 'gestor'::app_role) AND status = ANY (ARRAY['rascunho','submetida','rejeitada']))
  OR (evaluator_id = auth.uid() AND status = ANY (ARRAY['rascunho','rejeitada']))
  OR (employee_id = auth.uid() AND status = 'aprovada' AND acknowledged_at IS NULL)
)
WITH CHECK (
  is_admin()
  OR has_role(auth.uid(), 'diretor'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR evaluator_id = auth.uid()
  OR employee_id = auth.uid()
);