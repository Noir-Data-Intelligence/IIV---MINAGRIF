
-- Stations (estações zootécnicas/experimentais)
CREATE TABLE public.stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  station_type TEXT NOT NULL, -- zootecnica, experimental, campo
  location TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  responsible_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view stations" ON public.stations FOR SELECT USING (true);
CREATE POLICY "Only admin can insert stations" ON public.stations FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admin can update stations" ON public.stations FOR UPDATE USING (is_admin());
CREATE POLICY "Only admin can delete stations" ON public.stations FOR DELETE USING (is_admin());

CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON public.stations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quality control: audits
CREATE TYPE public.audit_status AS ENUM ('planeada', 'em_curso', 'concluida', 'cancelada');
CREATE TYPE public.nonconformity_severity AS ENUM ('menor', 'maior', 'critica');
CREATE TYPE public.nonconformity_status AS ENUM ('aberta', 'em_resolucao', 'resolvida', 'encerrada');

CREATE TABLE public.quality_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  audit_type TEXT NOT NULL, -- interna, externa, ISO
  department_id UUID REFERENCES public.departments(id),
  laboratory_id UUID REFERENCES public.laboratories(id),
  auditor TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  status audit_status NOT NULL DEFAULT 'planeada',
  findings TEXT,
  recommendations TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quality_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view audits" ON public.quality_audits FOR SELECT USING (true);
CREATE POLICY "Only admin can insert audits" ON public.quality_audits FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admin can update audits" ON public.quality_audits FOR UPDATE USING (is_admin());
CREATE POLICY "Only admin can delete audits" ON public.quality_audits FOR DELETE USING (is_admin());

CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON public.quality_audits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Non-conformities
CREATE TABLE public.nonconformities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES public.quality_audits(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity nonconformity_severity NOT NULL DEFAULT 'menor',
  status nonconformity_status NOT NULL DEFAULT 'aberta',
  department_id UUID REFERENCES public.departments(id),
  corrective_action TEXT,
  deadline DATE,
  resolved_at TIMESTAMPTZ,
  reported_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nonconformities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view nonconformities" ON public.nonconformities FOR SELECT USING (true);
CREATE POLICY "Only admin can insert nonconformities" ON public.nonconformities FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admin can update nonconformities" ON public.nonconformities FOR UPDATE USING (is_admin());
CREATE POLICY "Only admin can delete nonconformities" ON public.nonconformities FOR DELETE USING (is_admin());

CREATE TRIGGER update_nonconformities_updated_at BEFORE UPDATE ON public.nonconformities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Activity logs for security audit trail
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admin can view logs" ON public.activity_logs FOR SELECT USING (is_admin());
CREATE POLICY "Authenticated can insert logs" ON public.activity_logs FOR INSERT WITH CHECK (true);
