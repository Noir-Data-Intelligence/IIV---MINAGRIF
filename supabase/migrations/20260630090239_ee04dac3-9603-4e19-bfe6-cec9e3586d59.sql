
-- 1) PROFILES
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, full_name, avatar_url, created_at, updated_at) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (id uuid, user_id uuid, full_name text, phone text, avatar_url text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, user_id, full_name, phone, avatar_url, created_at, updated_at
  FROM public.profiles
  WHERE user_id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- 2) BUDGETS
DROP POLICY IF EXISTS "Auth view budgets" ON public.budgets;
CREATE POLICY "Admin gestor diretor view budgets"
ON public.budgets FOR SELECT TO authenticated
USING (public.is_admin() OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'diretor'));

-- 3) FINANCIAL TRANSACTIONS
DROP POLICY IF EXISTS "Auth view financial_transactions" ON public.financial_transactions;
CREATE POLICY "Admin gestor diretor view financial_transactions"
ON public.financial_transactions FOR SELECT TO authenticated
USING (public.is_admin() OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'diretor'));

-- 4) EMPLOYEES
DROP POLICY IF EXISTS "Auth view employees" ON public.employees;
CREATE POLICY "Restricted view employees"
ON public.employees FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR public.has_role(auth.uid(),'gestor')
  OR public.has_role(auth.uid(),'diretor')
  OR user_id = auth.uid()
);

-- 5) EMPLOYEE CONTRACTS
DROP POLICY IF EXISTS "Auth view employee_contracts" ON public.employee_contracts;
CREATE POLICY "Restricted view employee_contracts"
ON public.employee_contracts FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR public.has_role(auth.uid(),'gestor')
  OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
);

-- 6) EMPLOYEE LEAVES
DROP POLICY IF EXISTS "Auth view employee_leaves" ON public.employee_leaves;
CREATE POLICY "Restricted view employee_leaves"
ON public.employee_leaves FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR public.has_role(auth.uid(),'gestor')
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
);

-- 7) EMPLOYEE EVALUATIONS
DROP POLICY IF EXISTS emp_eval_select ON public.employee_evaluations;
CREATE POLICY emp_eval_select
ON public.employee_evaluations FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR public.has_role(auth.uid(),'diretor')
  OR (employee_id = auth.uid())
  OR (evaluator_id = auth.uid())
  OR (
    public.has_role(auth.uid(),'gestor')
    AND EXISTS (
      SELECT 1
      FROM public.employees e
      JOIN public.user_departments ud ON ud.department_id = e.department_id
      WHERE e.user_id = employee_evaluations.employee_id
        AND ud.user_id = auth.uid()
    )
  )
);

-- 8) LAB ANALYSES
DROP POLICY IF EXISTS "Authenticated can view analyses" ON public.lab_analyses;
CREATE POLICY "Restricted view lab_analyses"
ON public.lab_analyses FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR public.has_role(auth.uid(),'tecnico')
  OR public.has_role(auth.uid(),'gestor')
  OR requested_by = auth.uid()
);

-- 9) MISSION EXPENSES
DROP POLICY IF EXISTS "Auth view mission_expenses" ON public.mission_expenses;
CREATE POLICY "Restricted view mission_expenses"
ON public.mission_expenses FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR public.has_role(auth.uid(),'gestor')
  OR public.has_role(auth.uid(),'diretor')
  OR recorded_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.mission_participants mp WHERE mp.mission_id = mission_expenses.mission_id AND mp.user_id = auth.uid())
);

-- 10) MISSION PARTICIPANTS
DROP POLICY IF EXISTS "Auth view mission_participants" ON public.mission_participants;
CREATE POLICY "Restricted view mission_participants"
ON public.mission_participants FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR public.has_role(auth.uid(),'gestor')
  OR public.has_role(auth.uid(),'diretor')
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.mission_participants mp WHERE mp.mission_id = mission_participants.mission_id AND mp.user_id = auth.uid())
);

-- 11) STORAGE documents bucket
CREATE OR REPLACE FUNCTION public.can_view_documents_object(_name text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR (auth.uid())::text = (storage.foldername(_name))[1]
    OR EXISTS (
      SELECT 1 FROM public.document_versions dv
      JOIN public.documents d ON d.id = dv.document_id
      WHERE dv.file_path = _name AND public.can_view_document(d.id, auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.mission_expenses me
      WHERE me.receipt_url = _name
        AND (
          public.has_role(auth.uid(),'gestor')
          OR public.has_role(auth.uid(),'diretor')
          OR me.recorded_by = auth.uid()
          OR EXISTS (SELECT 1 FROM public.mission_participants mp WHERE mp.mission_id = me.mission_id AND mp.user_id = auth.uid())
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.mission_reports mr
      WHERE mr.report_url = _name
        AND (
          public.has_role(auth.uid(),'gestor')
          OR public.has_role(auth.uid(),'diretor')
          OR mr.submitted_by = auth.uid()
          OR EXISTS (SELECT 1 FROM public.mission_participants mp WHERE mp.mission_id = mr.mission_id AND mp.user_id = auth.uid())
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.process_attachments pa
      WHERE pa.file_path = _name AND public.is_process_actor(pa.process_id, auth.uid())
    );
$$;
REVOKE EXECUTE ON FUNCTION public.can_view_documents_object(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_documents_object(text) TO authenticated;

DROP POLICY IF EXISTS "Authenticated can read documents bucket" ON storage.objects;
CREATE POLICY "Authorized users read documents bucket"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND public.can_view_documents_object(name));

DROP POLICY IF EXISTS "Authenticated can upload to documents bucket" ON storage.objects;
CREATE POLICY "Authorized users upload documents bucket"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR (storage.foldername(name))[1] = 'missions'
    OR (storage.foldername(name))[1] = 'processes'
    OR public.is_admin()
  )
);

-- 12) CONTACT MESSAGES (uses Portuguese column names: nome, mensagem)
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (
  nome IS NOT NULL AND length(btrim(nome)) BETWEEN 2 AND 200
  AND email IS NOT NULL AND length(btrim(email)) BETWEEN 5 AND 200
  AND email LIKE '%@%.%'
  AND mensagem IS NOT NULL AND length(btrim(mensagem)) BETWEEN 5 AND 5000
);

-- 13) SECURITY DEFINER function grants
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_evaluation_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_mission_status_from_process() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_process_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.can_view_document(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.can_view_document(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.can_edit_document(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.can_edit_document(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_process_actor(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_process_actor(uuid, uuid) TO authenticated;

-- 14) Revoke anon SELECT on internal tables
DO $$
DECLARE
  t text;
  keep text[] := ARRAY[
    'hero_slides','noticias','legislation',
    'production_batches','products','stations','quality_audits',
    'batch_distributions','nonconformities','production_plans',
    'contact_messages'
  ];
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND NOT (c.relname = ANY (keep))
  LOOP
    EXECUTE format('REVOKE SELECT ON public.%I FROM anon', t);
  END LOOP;
END $$;
