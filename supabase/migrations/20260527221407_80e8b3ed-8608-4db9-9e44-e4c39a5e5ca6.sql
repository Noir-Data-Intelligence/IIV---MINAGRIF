
-- ENUMS
CREATE TYPE public.financial_account_type AS ENUM ('receita', 'despesa');
CREATE TYPE public.transaction_status AS ENUM ('pendente', 'pago', 'cancelado');
CREATE TYPE public.asset_status AS ENUM ('activo', 'em_manutencao', 'avariado', 'abatido', 'reservado');
CREATE TYPE public.maintenance_type AS ENUM ('preventiva', 'correctiva', 'inspeccao', 'calibracao');

-- ============ FINANCIAL ACCOUNTS ============
CREATE TABLE public.financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  type public.financial_account_type NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_accounts TO authenticated;
GRANT ALL ON public.financial_accounts TO service_role;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view financial_accounts" ON public.financial_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor insert financial_accounts" ON public.financial_accounts FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "Admin gestor update financial_accounts" ON public.financial_accounts FOR UPDATE TO authenticated
  USING (is_admin() OR has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "Admin delete financial_accounts" ON public.financial_accounts FOR DELETE TO authenticated
  USING (is_admin());

-- ============ FINANCIAL TRANSACTIONS ============
CREATE TABLE public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  department_id uuid,
  type public.financial_account_type NOT NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'AOA',
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  reference text,
  status public.transaction_status NOT NULL DEFAULT 'pago',
  recorded_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fin_tx_date ON public.financial_transactions(transaction_date DESC);
CREATE INDEX idx_fin_tx_account ON public.financial_transactions(account_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT ALL ON public.financial_transactions TO service_role;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view financial_transactions" ON public.financial_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor insert financial_transactions" ON public.financial_transactions FOR INSERT TO authenticated
  WITH CHECK ((recorded_by = auth.uid()) AND (is_admin() OR has_role(auth.uid(), 'gestor'::app_role)));
CREATE POLICY "Admin or recorder update financial_transactions" ON public.financial_transactions FOR UPDATE TO authenticated
  USING (is_admin() OR (recorded_by = auth.uid() AND has_role(auth.uid(), 'gestor'::app_role)));
CREATE POLICY "Admin or recorder delete financial_transactions" ON public.financial_transactions FOR DELETE TO authenticated
  USING (is_admin() OR (recorded_by = auth.uid() AND has_role(auth.uid(), 'gestor'::app_role)));

-- ============ BUDGETS ============
CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  account_id uuid NOT NULL,
  department_id uuid,
  planned_amount numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(year, account_id, department_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view budgets" ON public.budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor insert budgets" ON public.budgets FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "Admin gestor update budgets" ON public.budgets FOR UPDATE TO authenticated
  USING (is_admin() OR has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "Admin delete budgets" ON public.budgets FOR DELETE TO authenticated
  USING (is_admin());

-- ============ ASSETS ============
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  location text,
  station_id uuid,
  department_id uuid,
  responsible_user_id uuid,
  acquisition_date date,
  acquisition_cost numeric(14,2) NOT NULL DEFAULT 0,
  current_value numeric(14,2),
  serial_number text,
  status public.asset_status NOT NULL DEFAULT 'activo',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_station ON public.assets(station_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor insert assets" ON public.assets FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "Admin gestor update assets" ON public.assets FOR UPDATE TO authenticated
  USING (is_admin() OR has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "Admin delete assets" ON public.assets FOR DELETE TO authenticated
  USING (is_admin());

-- ============ ASSET MAINTENANCE ============
CREATE TABLE public.asset_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL,
  maintenance_date date NOT NULL DEFAULT CURRENT_DATE,
  type public.maintenance_type NOT NULL DEFAULT 'preventiva',
  description text NOT NULL,
  cost numeric(14,2) NOT NULL DEFAULT 0,
  provider text,
  performed_by uuid,
  next_due_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_asset_maint_asset ON public.asset_maintenance(asset_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_maintenance TO authenticated;
GRANT ALL ON public.asset_maintenance TO service_role;
ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view asset_maintenance" ON public.asset_maintenance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor tecnico insert asset_maintenance" ON public.asset_maintenance FOR INSERT TO authenticated
  WITH CHECK ((performed_by = auth.uid()) AND (is_admin() OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'tecnico'::app_role)));
CREATE POLICY "Admin or performer update asset_maintenance" ON public.asset_maintenance FOR UPDATE TO authenticated
  USING (is_admin() OR performed_by = auth.uid());
CREATE POLICY "Admin or performer delete asset_maintenance" ON public.asset_maintenance FOR DELETE TO authenticated
  USING (is_admin() OR performed_by = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER trg_fin_accounts_updated BEFORE UPDATE ON public.financial_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_fin_tx_updated BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_budgets_updated BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_assets_updated BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
