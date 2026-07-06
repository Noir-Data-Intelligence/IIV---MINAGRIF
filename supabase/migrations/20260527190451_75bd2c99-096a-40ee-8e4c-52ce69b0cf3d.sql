
-- Phase 2: Integrated Stock + Agro/Pecuária

-- ENUMS
CREATE TYPE public.stock_category AS ENUM ('laboratorio','vacinas','agricola','pecuaria','administrativo','semen','combustivel');
CREATE TYPE public.stock_movement_type AS ENUM ('entrada','saida','transferencia','ajuste');
CREATE TYPE public.crop_field_status AS ENUM ('planeado','plantado','em_crescimento','colhido','abandonado');

-- stock_locations
CREATE TABLE public.stock_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  station_id UUID,
  laboratory_id UUID,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_locations TO authenticated;
GRANT ALL ON public.stock_locations TO service_role;
ALTER TABLE public.stock_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view stock_locations" ON public.stock_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor insert stock_locations" ON public.stock_locations FOR INSERT TO authenticated WITH CHECK (is_admin() OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin gestor update stock_locations" ON public.stock_locations FOR UPDATE TO authenticated USING (is_admin() OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin delete stock_locations" ON public.stock_locations FOR DELETE TO authenticated USING (is_admin());

-- stock_items
CREATE TABLE public.stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category public.stock_category NOT NULL,
  sku TEXT,
  unit TEXT NOT NULL DEFAULT 'unidade',
  quantity NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  location_id UUID,
  expiry_date DATE,
  supplier TEXT,
  unit_cost NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_items_category ON public.stock_items(category);
CREATE INDEX idx_stock_items_location ON public.stock_items(location_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_items TO authenticated;
GRANT ALL ON public.stock_items TO service_role;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view stock_items" ON public.stock_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor tecnico insert stock_items" ON public.stock_items FOR INSERT TO authenticated WITH CHECK (is_admin() OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'tecnico'));
CREATE POLICY "Admin gestor tecnico update stock_items" ON public.stock_items FOR UPDATE TO authenticated USING (is_admin() OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'tecnico'));
CREATE POLICY "Admin gestor delete stock_items" ON public.stock_items FOR DELETE TO authenticated USING (is_admin() OR has_role(auth.uid(),'gestor'));

-- stock_movements
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  type public.stock_movement_type NOT NULL,
  quantity NUMERIC NOT NULL,
  from_location_id UUID,
  to_location_id UUID,
  reason TEXT,
  performed_by UUID,
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_movements_item ON public.stock_movements(item_id);
CREATE INDEX idx_stock_movements_date ON public.stock_movements(movement_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view stock_movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor tecnico insert stock_movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK ((performed_by = auth.uid()) AND (is_admin() OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'tecnico')));
CREATE POLICY "Admin or recorder update stock_movements" ON public.stock_movements FOR UPDATE TO authenticated USING (is_admin() OR performed_by = auth.uid());
CREATE POLICY "Admin or recorder delete stock_movements" ON public.stock_movements FOR DELETE TO authenticated USING (is_admin() OR performed_by = auth.uid());

-- crops
CREATE TABLE public.crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scientific_name TEXT,
  cycle_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crops TO authenticated;
GRANT ALL ON public.crops TO service_role;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view crops" ON public.crops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor insert crops" ON public.crops FOR INSERT TO authenticated WITH CHECK (is_admin() OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin gestor update crops" ON public.crops FOR UPDATE TO authenticated USING (is_admin() OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin delete crops" ON public.crops FOR DELETE TO authenticated USING (is_admin());

-- crop_fields
CREATE TABLE public.crop_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL,
  crop_id UUID NOT NULL,
  field_code TEXT,
  area_ha NUMERIC NOT NULL DEFAULT 0,
  planting_date DATE,
  expected_harvest DATE,
  status public.crop_field_status NOT NULL DEFAULT 'planeado',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_crop_fields_station ON public.crop_fields(station_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_fields TO authenticated;
GRANT ALL ON public.crop_fields TO service_role;
ALTER TABLE public.crop_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view crop_fields" ON public.crop_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor tecnico insert crop_fields" ON public.crop_fields FOR INSERT TO authenticated WITH CHECK (is_admin() OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'tecnico'));
CREATE POLICY "Admin gestor tecnico update crop_fields" ON public.crop_fields FOR UPDATE TO authenticated USING (is_admin() OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'tecnico'));
CREATE POLICY "Admin gestor delete crop_fields" ON public.crop_fields FOR DELETE TO authenticated USING (is_admin() OR has_role(auth.uid(),'gestor'));

-- harvests
CREATE TABLE public.harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL,
  harvest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  quality_grade TEXT,
  recorded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_harvests_field ON public.harvests(field_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.harvests TO authenticated;
GRANT ALL ON public.harvests TO service_role;
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view harvests" ON public.harvests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor tecnico insert harvests" ON public.harvests FOR INSERT TO authenticated WITH CHECK ((recorded_by = auth.uid()) AND (is_admin() OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'tecnico')));
CREATE POLICY "Admin or recorder update harvests" ON public.harvests FOR UPDATE TO authenticated USING (is_admin() OR recorded_by = auth.uid());
CREATE POLICY "Admin or recorder delete harvests" ON public.harvests FOR DELETE TO authenticated USING (is_admin() OR recorded_by = auth.uid());

-- livestock_production
CREATE TABLE public.livestock_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL,
  product_type TEXT NOT NULL,
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  recorded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_livestock_production_station ON public.livestock_production(station_id);
CREATE INDEX idx_livestock_production_date ON public.livestock_production(production_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.livestock_production TO authenticated;
GRANT ALL ON public.livestock_production TO service_role;
ALTER TABLE public.livestock_production ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view livestock_production" ON public.livestock_production FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor tecnico insert livestock_production" ON public.livestock_production FOR INSERT TO authenticated WITH CHECK ((recorded_by = auth.uid()) AND (is_admin() OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'tecnico')));
CREATE POLICY "Admin or recorder update livestock_production" ON public.livestock_production FOR UPDATE TO authenticated USING (is_admin() OR recorded_by = auth.uid());
CREATE POLICY "Admin or recorder delete livestock_production" ON public.livestock_production FOR DELETE TO authenticated USING (is_admin() OR recorded_by = auth.uid());

-- Triggers updated_at
CREATE TRIGGER trg_stock_locations_updated BEFORE UPDATE ON public.stock_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_stock_items_updated BEFORE UPDATE ON public.stock_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crops_updated BEFORE UPDATE ON public.crops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crop_fields_updated BEFORE UPDATE ON public.crop_fields FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
