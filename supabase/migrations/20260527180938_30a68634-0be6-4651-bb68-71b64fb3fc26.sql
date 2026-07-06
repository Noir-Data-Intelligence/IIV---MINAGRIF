
-- FASE 1.1 — Animais nas Estações

-- Enums
DO $$ BEGIN
  CREATE TYPE public.animal_sex AS ENUM ('macho', 'femea');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.animal_status AS ENUM ('activo', 'vendido', 'morto', 'abatido', 'transferido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.animal_event_type AS ENUM ('nascimento', 'pesagem', 'vacinacao', 'tratamento', 'transferencia', 'venda', 'morte', 'abate', 'observacao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela animals
CREATE TABLE public.animals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id UUID NOT NULL,
  tag TEXT NOT NULL,
  name TEXT,
  species TEXT NOT NULL,
  breed TEXT,
  sex public.animal_sex NOT NULL,
  birth_date DATE,
  mother_tag TEXT,
  father_tag TEXT,
  status public.animal_status NOT NULL DEFAULT 'activo',
  current_weight_kg NUMERIC(8,2),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (station_id, tag)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.animals TO authenticated;
GRANT ALL ON public.animals TO service_role;

ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view animals"
  ON public.animals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gestor tecnico insert animals"
  ON public.animals FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'tecnico'::app_role));

CREATE POLICY "Admin gestor tecnico update animals"
  ON public.animals FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'tecnico'::app_role));

CREATE POLICY "Admin or gestor delete animals"
  ON public.animals FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE TRIGGER update_animals_updated_at
  BEFORE UPDATE ON public.animals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_animals_station ON public.animals(station_id);
CREATE INDEX idx_animals_status ON public.animals(status);
CREATE INDEX idx_animals_species ON public.animals(species);

-- Tabela animal_events
CREATE TABLE public.animal_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  event_type public.animal_event_type NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  details JSONB,
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.animal_events TO authenticated;
GRANT ALL ON public.animal_events TO service_role;

ALTER TABLE public.animal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view animal_events"
  ON public.animal_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gestor tecnico insert animal_events"
  ON public.animal_events FOR INSERT TO authenticated
  WITH CHECK (
    (recorded_by = auth.uid()) AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'tecnico'::app_role))
  );

CREATE POLICY "Admin or recorder update animal_events"
  ON public.animal_events FOR UPDATE TO authenticated
  USING (is_admin() OR recorded_by = auth.uid());

CREATE POLICY "Admin or recorder delete animal_events"
  ON public.animal_events FOR DELETE TO authenticated
  USING (is_admin() OR recorded_by = auth.uid());

CREATE INDEX idx_animal_events_animal ON public.animal_events(animal_id);
CREATE INDEX idx_animal_events_type ON public.animal_events(event_type);

-- Tabela animal_health_records
CREATE TABLE public.animal_health_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  product_name TEXT,
  dosage TEXT,
  diagnosis TEXT,
  treatment TEXT,
  veterinarian TEXT,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_due_date DATE,
  recorded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.animal_health_records TO authenticated;
GRANT ALL ON public.animal_health_records TO service_role;

ALTER TABLE public.animal_health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view animal_health"
  ON public.animal_health_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gestor tecnico insert animal_health"
  ON public.animal_health_records FOR INSERT TO authenticated
  WITH CHECK (
    (recorded_by = auth.uid()) AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'tecnico'::app_role))
  );

CREATE POLICY "Admin or recorder update animal_health"
  ON public.animal_health_records FOR UPDATE TO authenticated
  USING (is_admin() OR recorded_by = auth.uid());

CREATE POLICY "Admin or recorder delete animal_health"
  ON public.animal_health_records FOR DELETE TO authenticated
  USING (is_admin() OR recorded_by = auth.uid());

CREATE INDEX idx_animal_health_animal ON public.animal_health_records(animal_id);
