
-- Enums
CREATE TYPE public.breeder_status AS ENUM ('activo', 'inactivo', 'baixado');
CREATE TYPE public.insemination_result AS ENUM ('pendente', 'confirmada', 'falhou');
CREATE TYPE public.semen_quality AS ENUM ('A', 'B', 'C');

-- ia_centers
CREATE TABLE public.ia_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  responsible_user_id UUID,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ia_centers TO authenticated;
GRANT ALL ON public.ia_centers TO service_role;
ALTER TABLE public.ia_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view ia_centers" ON public.ia_centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor insert ia_centers" ON public.ia_centers FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "Admin gestor update ia_centers" ON public.ia_centers FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "Admin delete ia_centers" ON public.ia_centers FOR DELETE TO authenticated USING (is_admin());

-- breeders
CREATE TABLE public.breeders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL,
  tag TEXT NOT NULL,
  name TEXT,
  species TEXT NOT NULL,
  breed TEXT,
  birth_date DATE,
  status public.breeder_status NOT NULL DEFAULT 'activo',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_breeders_center ON public.breeders(center_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.breeders TO authenticated;
GRANT ALL ON public.breeders TO service_role;
ALTER TABLE public.breeders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view breeders" ON public.breeders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor tecnico insert breeders" ON public.breeders FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'tecnico'::app_role));
CREATE POLICY "Admin gestor tecnico update breeders" ON public.breeders FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'tecnico'::app_role));
CREATE POLICY "Admin gestor delete breeders" ON public.breeders FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

-- nitrogen_tanks
CREATE TABLE public.nitrogen_tanks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL,
  code TEXT NOT NULL,
  capacity_l NUMERIC NOT NULL DEFAULT 0,
  current_level_l NUMERIC NOT NULL DEFAULT 0,
  min_level_l NUMERIC NOT NULL DEFAULT 0,
  last_refill_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tanks_center ON public.nitrogen_tanks(center_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nitrogen_tanks TO authenticated;
GRANT ALL ON public.nitrogen_tanks TO service_role;
ALTER TABLE public.nitrogen_tanks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view tanks" ON public.nitrogen_tanks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor tecnico insert tanks" ON public.nitrogen_tanks FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'tecnico'::app_role));
CREATE POLICY "Admin gestor tecnico update tanks" ON public.nitrogen_tanks FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'tecnico'::app_role));
CREATE POLICY "Admin gestor delete tanks" ON public.nitrogen_tanks FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

-- semen_doses
CREATE TABLE public.semen_doses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breeder_id UUID NOT NULL,
  tank_id UUID,
  collection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  quality_grade public.semen_quality DEFAULT 'A',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doses_breeder ON public.semen_doses(breeder_id);
CREATE INDEX idx_doses_tank ON public.semen_doses(tank_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.semen_doses TO authenticated;
GRANT ALL ON public.semen_doses TO service_role;
ALTER TABLE public.semen_doses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view doses" ON public.semen_doses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor tecnico insert doses" ON public.semen_doses FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'tecnico'::app_role));
CREATE POLICY "Admin gestor tecnico update doses" ON public.semen_doses FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'tecnico'::app_role));
CREATE POLICY "Admin gestor delete doses" ON public.semen_doses FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

-- insemination_records
CREATE TABLE public.insemination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL,
  dose_id UUID,
  technician_id UUID,
  insemination_date DATE NOT NULL DEFAULT CURRENT_DATE,
  result public.insemination_result NOT NULL DEFAULT 'pendente',
  pregnancy_confirmed_at DATE,
  expected_birth_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_insem_animal ON public.insemination_records(animal_id);
CREATE INDEX idx_insem_dose ON public.insemination_records(dose_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insemination_records TO authenticated;
GRANT ALL ON public.insemination_records TO service_role;
ALTER TABLE public.insemination_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view insem" ON public.insemination_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor tecnico insert insem" ON public.insemination_records FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'tecnico'::app_role));
CREATE POLICY "Admin gestor tecnico update insem" ON public.insemination_records FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'tecnico'::app_role));
CREATE POLICY "Admin gestor delete insem" ON public.insemination_records FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

-- updated_at triggers
CREATE TRIGGER set_ia_centers_updated_at BEFORE UPDATE ON public.ia_centers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_breeders_updated_at BEFORE UPDATE ON public.breeders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_tanks_updated_at BEFORE UPDATE ON public.nitrogen_tanks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_doses_updated_at BEFORE UPDATE ON public.semen_doses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_insem_updated_at BEFORE UPDATE ON public.insemination_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
