
-- Analysis status enum
CREATE TYPE public.analysis_status AS ENUM ('agendada', 'em_progresso', 'concluida', 'cancelada');

-- Laboratories table
CREATE TABLE public.laboratories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- virologia, bacteriologia, parasitologia, etc.
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lab analyses (scheduling + results)
CREATE TABLE public.lab_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laboratory_id UUID REFERENCES public.laboratories(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  animal_species TEXT,
  animal_id TEXT,
  sample_type TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  status analysis_status NOT NULL DEFAULT 'agendada',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lab results
CREATE TABLE public.lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.lab_analyses(id) ON DELETE CASCADE NOT NULL UNIQUE,
  result_text TEXT NOT NULL,
  result_details JSONB,
  concluded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  concluded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lab supplies/reagents inventory
CREATE TABLE public.lab_supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laboratory_id UUID REFERENCES public.laboratories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'unidade',
  min_stock INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_supplies ENABLE ROW LEVEL SECURITY;

-- RLS: Laboratories
CREATE POLICY "Authenticated can view laboratories" ON public.laboratories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admin can insert laboratories" ON public.laboratories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Only admin can update laboratories" ON public.laboratories FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Only admin can delete laboratories" ON public.laboratories FOR DELETE TO authenticated USING (public.is_admin());

-- RLS: Lab analyses (authenticated users can view all, but only admin/tecnico can create)
CREATE POLICY "Authenticated can view analyses" ON public.lab_analyses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert analyses" ON public.lab_analyses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin or requester can update analyses" ON public.lab_analyses FOR UPDATE TO authenticated USING (public.is_admin() OR auth.uid() = requested_by);
CREATE POLICY "Only admin can delete analyses" ON public.lab_analyses FOR DELETE TO authenticated USING (public.is_admin());

-- RLS: Lab results
CREATE POLICY "Authenticated can view results" ON public.lab_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert results" ON public.lab_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can update results" ON public.lab_results FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Only admin can delete results" ON public.lab_results FOR DELETE TO authenticated USING (public.is_admin());

-- RLS: Lab supplies
CREATE POLICY "Authenticated can view supplies" ON public.lab_supplies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admin can insert supplies" ON public.lab_supplies FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Only admin can update supplies" ON public.lab_supplies FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Only admin can delete supplies" ON public.lab_supplies FOR DELETE TO authenticated USING (public.is_admin());

-- Triggers for updated_at
CREATE TRIGGER update_laboratories_updated_at BEFORE UPDATE ON public.laboratories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lab_analyses_updated_at BEFORE UPDATE ON public.lab_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lab_supplies_updated_at BEFORE UPDATE ON public.lab_supplies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some laboratories
INSERT INTO public.laboratories (name, type, description) VALUES
  ('Laboratório de Virologia', 'virologia', 'Diagnóstico de doenças virais em animais'),
  ('Laboratório de Bacteriologia', 'bacteriologia', 'Análises bacteriológicas e antibiogramas'),
  ('Laboratório de Parasitologia', 'parasitologia', 'Diagnóstico de parasitas em animais domésticos e selvagens'),
  ('Laboratório de Serologia', 'serologia', 'Testes serológicos e imunológicos'),
  ('Laboratório de Patologia', 'patologia', 'Exames histopatológicos e necropsias');
