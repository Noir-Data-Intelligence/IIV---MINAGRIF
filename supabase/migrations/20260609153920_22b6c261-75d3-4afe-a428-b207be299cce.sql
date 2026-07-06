
-- =========================
-- FASE 5 — Migration
-- =========================

-- 5.1 INVESTIGAÇÃO
CREATE TABLE public.research_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area text,
  coordinator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  description text,
  status text NOT NULL DEFAULT 'activa',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_lines TO authenticated;
GRANT ALL ON public.research_lines TO service_role;
ALTER TABLE public.research_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "research_lines_select" ON public.research_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "research_lines_insert" ON public.research_lines FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'diretor'));
CREATE POLICY "research_lines_update" ON public.research_lines FOR UPDATE TO authenticated USING (public.is_admin() OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'diretor'));
CREATE POLICY "research_lines_delete" ON public.research_lines FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER trg_research_lines_updated BEFORE UPDATE ON public.research_lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.research_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id uuid REFERENCES public.research_lines(id) ON DELETE SET NULL,
  title text NOT NULL,
  objectives text,
  start_date date,
  end_date date,
  funding_source text,
  funding_amount numeric,
  partners text,
  status text NOT NULL DEFAULT 'proposto',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_projects TO authenticated;
GRANT ALL ON public.research_projects TO service_role;
ALTER TABLE public.research_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "research_projects_select" ON public.research_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "research_projects_insert" ON public.research_projects FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'diretor'));
CREATE POLICY "research_projects_update" ON public.research_projects FOR UPDATE TO authenticated USING (public.is_admin() OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'diretor'));
CREATE POLICY "research_projects_delete" ON public.research_projects FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER trg_research_projects_updated BEFORE UPDATE ON public.research_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'investigador',
  joined_at date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_members_select" ON public.project_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "project_members_write" ON public.project_members FOR ALL TO authenticated USING (public.is_admin() OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'diretor')) WITH CHECK (public.is_admin() OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'diretor'));

CREATE TABLE public.publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.research_projects(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'artigo',
  title text NOT NULL,
  authors jsonb NOT NULL DEFAULT '[]'::jsonb,
  year integer,
  venue text,
  doi text,
  url text,
  abstract text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publications TO authenticated;
GRANT ALL ON public.publications TO service_role;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "publications_select" ON public.publications FOR SELECT TO authenticated USING (true);
CREATE POLICY "publications_insert" ON public.publications FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "publications_update" ON public.publications FOR UPDATE TO authenticated USING (public.is_admin() OR public.has_role(auth.uid(),'gestor') OR created_by = auth.uid());
CREATE POLICY "publications_delete" ON public.publications FOR DELETE TO authenticated USING (public.is_admin() OR created_by = auth.uid());
CREATE TRIGGER trg_publications_updated BEFORE UPDATE ON public.publications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5.2 AVALIAÇÕES
CREATE TABLE public.evaluation_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  year integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'planeado',
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_cycles TO authenticated;
GRANT ALL ON public.evaluation_cycles TO service_role;
ALTER TABLE public.evaluation_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eval_cycles_select" ON public.evaluation_cycles FOR SELECT TO authenticated USING (true);
CREATE POLICY "eval_cycles_write" ON public.evaluation_cycles FOR ALL TO authenticated USING (public.is_admin() OR public.has_role(auth.uid(),'gestor')) WITH CHECK (public.is_admin() OR public.has_role(auth.uid(),'gestor'));
CREATE TRIGGER trg_eval_cycles_updated BEFORE UPDATE ON public.evaluation_cycles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.evaluation_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.evaluation_cycles(id) ON DELETE CASCADE,
  name text NOT NULL,
  weight numeric NOT NULL DEFAULT 1,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_criteria TO authenticated;
GRANT ALL ON public.evaluation_criteria TO service_role;
ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eval_criteria_select" ON public.evaluation_criteria FOR SELECT TO authenticated USING (true);
CREATE POLICY "eval_criteria_write" ON public.evaluation_criteria FOR ALL TO authenticated USING (public.is_admin() OR public.has_role(auth.uid(),'gestor')) WITH CHECK (public.is_admin() OR public.has_role(auth.uid(),'gestor'));

CREATE TABLE public.employee_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.evaluation_cycles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  evaluation_date date,
  global_score numeric,
  strengths text,
  improvements text,
  general_comments text,
  status text NOT NULL DEFAULT 'rascunho',
  submitted_at timestamptz,
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cycle_id, employee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_evaluations TO authenticated;
GRANT ALL ON public.employee_evaluations TO service_role;
ALTER TABLE public.employee_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emp_eval_select" ON public.employee_evaluations FOR SELECT TO authenticated USING (
  public.is_admin() OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'diretor')
  OR employee_id = auth.uid() OR evaluator_id = auth.uid()
);
CREATE POLICY "emp_eval_insert" ON public.employee_evaluations FOR INSERT TO authenticated WITH CHECK (
  public.is_admin() OR public.has_role(auth.uid(),'gestor') OR evaluator_id = auth.uid()
);
CREATE POLICY "emp_eval_update" ON public.employee_evaluations FOR UPDATE TO authenticated USING (
  public.is_admin() OR public.has_role(auth.uid(),'gestor') OR evaluator_id = auth.uid()
  OR (employee_id = auth.uid() AND status = 'rascunho')
);
CREATE POLICY "emp_eval_delete" ON public.employee_evaluations FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER trg_emp_eval_updated BEFORE UPDATE ON public.employee_evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.evaluation_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.employee_evaluations(id) ON DELETE CASCADE,
  criteria_id uuid NOT NULL REFERENCES public.evaluation_criteria(id) ON DELETE CASCADE,
  score numeric NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(evaluation_id, criteria_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_scores TO authenticated;
GRANT ALL ON public.evaluation_scores TO service_role;
ALTER TABLE public.evaluation_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eval_scores_select" ON public.evaluation_scores FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.employee_evaluations e WHERE e.id = evaluation_id AND (
    public.is_admin() OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'diretor')
    OR e.employee_id = auth.uid() OR e.evaluator_id = auth.uid()
  ))
);
CREATE POLICY "eval_scores_write" ON public.evaluation_scores FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.employee_evaluations e WHERE e.id = evaluation_id AND (
    public.is_admin() OR public.has_role(auth.uid(),'gestor') OR e.evaluator_id = auth.uid()
  ))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.employee_evaluations e WHERE e.id = evaluation_id AND (
    public.is_admin() OR public.has_role(auth.uid(),'gestor') OR e.evaluator_id = auth.uid()
  ))
);

-- 5.3 BPM MISSÕES
ALTER TABLE public.processes ADD COLUMN IF NOT EXISTS mission_id uuid REFERENCES public.missions(id) ON DELETE SET NULL;

CREATE TABLE public.mission_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  guide_number text NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  per_diem numeric DEFAULT 0,
  transport text,
  notes text,
  issued_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mission_guides TO authenticated;
GRANT ALL ON public.mission_guides TO service_role;
ALTER TABLE public.mission_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mguides_select" ON public.mission_guides FOR SELECT TO authenticated USING (true);
CREATE POLICY "mguides_write" ON public.mission_guides FOR ALL TO authenticated USING (public.is_admin() OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'diretor')) WITH CHECK (public.is_admin() OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'diretor'));
CREATE TRIGGER trg_mguides_updated BEFORE UPDATE ON public.mission_guides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.mission_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  summary text NOT NULL,
  outcomes text,
  attachments_url text,
  submitted_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  status text NOT NULL DEFAULT 'submetido',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mission_reports TO authenticated;
GRANT ALL ON public.mission_reports TO service_role;
ALTER TABLE public.mission_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mreports_select" ON public.mission_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "mreports_insert" ON public.mission_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "mreports_update" ON public.mission_reports FOR UPDATE TO authenticated USING (public.is_admin() OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'diretor') OR submitted_by = auth.uid());
CREATE POLICY "mreports_delete" ON public.mission_reports FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER trg_mreports_updated BEFORE UPDATE ON public.mission_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEED: linhas de pesquisa e ciclo
INSERT INTO public.research_lines (name, area, description, status) VALUES
  ('Sanidade Animal', 'Veterinária', 'Estudos epidemiológicos e diagnóstico de doenças do gado.', 'activa'),
  ('Melhoramento Genético', 'Reprodução', 'Inseminação artificial e selecção de reprodutores.', 'activa'),
  ('Produção Agro-Pecuária Sustentável', 'Agricultura', 'Optimização de culturas e práticas pecuárias.', 'activa');

INSERT INTO public.evaluation_cycles (name, year, start_date, end_date, status, description) VALUES
  ('Avaliação Anual ' || EXTRACT(YEAR FROM CURRENT_DATE)::text, EXTRACT(YEAR FROM CURRENT_DATE)::integer, date_trunc('year', CURRENT_DATE)::date, (date_trunc('year', CURRENT_DATE) + interval '1 year - 1 day')::date, 'aberto', 'Ciclo anual de avaliação de desempenho do IIV.');
