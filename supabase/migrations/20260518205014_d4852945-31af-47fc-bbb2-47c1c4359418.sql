
-- Role permission matrix (editable via admin RBAC UI).
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role app_role NOT NULL,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_write boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role, module)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view role_permissions"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admin can insert role_permissions"
  ON public.role_permissions FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Only admin can update role_permissions"
  ON public.role_permissions FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Only admin can delete role_permissions"
  ON public.role_permissions FOR DELETE TO authenticated USING (is_admin());

CREATE TRIGGER trg_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults matching current hardcoded matrix.
WITH modules(m) AS (
  VALUES ('painel'),('perfil'),('utilizadores'),('departamentos'),
         ('laboratorios'),('analises'),('resultados'),('insumos'),
         ('produtos'),('lotes'),('planeamento'),('distribuicao'),
         ('estacoes'),('auditorias'),('nao-conformidades'),('logs'),
         ('acessibilidade'),('legislacao'),('noticias'),('mensagens'),('slideshow')
),
matrix AS (
  -- admin: tudo
  SELECT 'admin'::app_role AS role, m, true AS v, true AS w FROM modules
  UNION ALL
  -- diretor: vê tudo, não escreve
  SELECT 'diretor'::app_role, m, true, false FROM modules
  UNION ALL
  -- gestor
  SELECT 'gestor'::app_role, m,
    m IN ('painel','perfil','departamentos','laboratorios','analises','resultados',
          'insumos','produtos','lotes','planeamento','distribuicao','estacoes',
          'auditorias','nao-conformidades'),
    m IN ('produtos','lotes','planeamento','distribuicao','estacoes','auditorias','nao-conformidades')
  FROM modules
  UNION ALL
  -- tecnico
  SELECT 'tecnico'::app_role, m,
    m IN ('painel','perfil','laboratorios','analises','resultados','insumos'),
    m IN ('analises','resultados','insumos')
  FROM modules
  UNION ALL
  -- colaborador
  SELECT 'colaborador'::app_role, m,
    m IN ('painel','perfil','analises','distribuicao'),
    false
  FROM modules
)
INSERT INTO public.role_permissions (role, module, can_view, can_write)
SELECT role, m, v, w FROM matrix
ON CONFLICT (role, module) DO NOTHING;
