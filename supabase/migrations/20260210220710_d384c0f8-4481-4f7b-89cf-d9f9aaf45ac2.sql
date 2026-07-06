
-- Enum for production status
CREATE TYPE public.production_status AS ENUM ('planeada', 'em_producao', 'concluida', 'suspensa');

-- Products (vaccines, sera, reagents)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  product_type TEXT NOT NULL, -- vacina, soro, reagente
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'dose',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Only admin can insert products" ON public.products FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admin can update products" ON public.products FOR UPDATE USING (is_admin());
CREATE POLICY "Only admin can delete products" ON public.products FOR DELETE USING (is_admin());

-- Production batches
CREATE TABLE public.production_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL UNIQUE,
  quantity_produced INTEGER NOT NULL DEFAULT 0,
  quantity_distributed INTEGER NOT NULL DEFAULT 0,
  production_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status production_status NOT NULL DEFAULT 'planeada',
  notes TEXT,
  produced_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view batches" ON public.production_batches FOR SELECT USING (true);
CREATE POLICY "Only admin can insert batches" ON public.production_batches FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admin can update batches" ON public.production_batches FOR UPDATE USING (is_admin());
CREATE POLICY "Only admin can delete batches" ON public.production_batches FOR DELETE USING (is_admin());

-- Production planning
CREATE TABLE public.production_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  planned_quantity INTEGER NOT NULL,
  planned_start DATE NOT NULL,
  planned_end DATE NOT NULL,
  actual_quantity INTEGER,
  status production_status NOT NULL DEFAULT 'planeada',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.production_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view plans" ON public.production_plans FOR SELECT USING (true);
CREATE POLICY "Only admin can insert plans" ON public.production_plans FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admin can update plans" ON public.production_plans FOR UPDATE USING (is_admin());
CREATE POLICY "Only admin can delete plans" ON public.production_plans FOR DELETE USING (is_admin());

-- Distribution tracking
CREATE TABLE public.batch_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  distribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  distributed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.batch_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view distributions" ON public.batch_distributions FOR SELECT USING (true);
CREATE POLICY "Only admin can insert distributions" ON public.batch_distributions FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admin can update distributions" ON public.batch_distributions FOR UPDATE USING (is_admin());
CREATE POLICY "Only admin can delete distributions" ON public.batch_distributions FOR DELETE USING (is_admin());

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.production_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.production_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
