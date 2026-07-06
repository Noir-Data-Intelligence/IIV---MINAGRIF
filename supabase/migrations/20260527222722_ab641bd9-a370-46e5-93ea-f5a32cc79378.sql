
-- ============== ENUMS ==============
CREATE TYPE public.mission_status AS ENUM ('planeada','aprovada','em_curso','concluida','cancelada');
CREATE TYPE public.mission_expense_category AS ENUM ('transporte','alojamento','alimentacao','combustivel','outro');
CREATE TYPE public.contract_type AS ENUM ('efectivo','termo_certo','termo_incerto','prestacao_servicos','estagio');
CREATE TYPE public.leave_type AS ENUM ('ferias','doenca','maternidade','paternidade','luto','sem_vencimento','outro');
CREATE TYPE public.leave_status AS ENUM ('pendente','aprovada','rejeitada','concluida');
CREATE TYPE public.training_status AS ENUM ('planeada','em_curso','concluida','cancelada');

-- ============== MISSIONS ==============
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  purpose TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status public.mission_status NOT NULL DEFAULT 'planeada',
  budget NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AOA',
  department_id UUID,
  created_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view missions" ON public.missions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor tecnico insert missions" ON public.missions FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'tecnico'));
CREATE POLICY "Admin gestor update missions" ON public.missions FOR UPDATE TO authenticated
  USING (is_admin() OR has_role(auth.uid(),'gestor') OR (created_by = auth.uid()));
CREATE POLICY "Admin gestor delete missions" ON public.missions FOR DELETE TO authenticated
  USING (is_admin() OR has_role(auth.uid(),'gestor'));

CREATE TABLE public.mission_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT,
  per_diem NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mission_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mission_participants TO authenticated;
GRANT ALL ON public.mission_participants TO service_role;
ALTER TABLE public.mission_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view mission_participants" ON public.mission_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor insert mission_participants" ON public.mission_participants FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin gestor update mission_participants" ON public.mission_participants FOR UPDATE TO authenticated
  USING (is_admin() OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin gestor delete mission_participants" ON public.mission_participants FOR DELETE TO authenticated
  USING (is_admin() OR has_role(auth.uid(),'gestor'));

CREATE TABLE public.mission_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL,
  category public.mission_expense_category NOT NULL DEFAULT 'outro',
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AOA',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mission_expenses TO authenticated;
GRANT ALL ON public.mission_expenses TO service_role;
ALTER TABLE public.mission_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view mission_expenses" ON public.mission_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor tecnico insert mission_expenses" ON public.mission_expenses FOR INSERT TO authenticated
  WITH CHECK ((recorded_by = auth.uid()) AND (is_admin() OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'tecnico')));
CREATE POLICY "Admin or recorder update mission_expenses" ON public.mission_expenses FOR UPDATE TO authenticated
  USING (is_admin() OR recorded_by = auth.uid());
CREATE POLICY "Admin or recorder delete mission_expenses" ON public.mission_expenses FOR DELETE TO authenticated
  USING (is_admin() OR recorded_by = auth.uid());

-- ============== EMPLOYEES ==============
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  employee_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  national_id TEXT,
  birth_date DATE,
  gender TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  qualifications TEXT,
  department_id UUID,
  hire_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor insert employees" ON public.employees FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin gestor update employees" ON public.employees FOR UPDATE TO authenticated
  USING (is_admin() OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin delete employees" ON public.employees FOR DELETE TO authenticated USING (is_admin());

CREATE TABLE public.employee_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  contract_type public.contract_type NOT NULL DEFAULT 'efectivo',
  position TEXT NOT NULL,
  department_id UUID,
  start_date DATE NOT NULL,
  end_date DATE,
  salary NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AOA',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_contracts TO authenticated;
GRANT ALL ON public.employee_contracts TO service_role;
ALTER TABLE public.employee_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view employee_contracts" ON public.employee_contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor insert employee_contracts" ON public.employee_contracts FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin gestor update employee_contracts" ON public.employee_contracts FOR UPDATE TO authenticated
  USING (is_admin() OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin delete employee_contracts" ON public.employee_contracts FOR DELETE TO authenticated USING (is_admin());

CREATE TABLE public.employee_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  leave_type public.leave_type NOT NULL DEFAULT 'ferias',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER,
  status public.leave_status NOT NULL DEFAULT 'pendente',
  approved_by UUID,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_leaves TO authenticated;
GRANT ALL ON public.employee_leaves TO service_role;
ALTER TABLE public.employee_leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view employee_leaves" ON public.employee_leaves FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert employee_leaves" ON public.employee_leaves FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admin gestor or creator update employee_leaves" ON public.employee_leaves FOR UPDATE TO authenticated
  USING (is_admin() OR has_role(auth.uid(),'gestor') OR created_by = auth.uid());
CREATE POLICY "Admin gestor delete employee_leaves" ON public.employee_leaves FOR DELETE TO authenticated
  USING (is_admin() OR has_role(auth.uid(),'gestor'));

-- ============== TRAININGS ==============
CREATE TABLE public.trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  trainer TEXT,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hours NUMERIC NOT NULL DEFAULT 0,
  status public.training_status NOT NULL DEFAULT 'planeada',
  created_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainings TO authenticated;
GRANT ALL ON public.trainings TO service_role;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view trainings" ON public.trainings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor tecnico insert trainings" ON public.trainings FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'tecnico'));
CREATE POLICY "Admin gestor update trainings" ON public.trainings FOR UPDATE TO authenticated
  USING (is_admin() OR has_role(auth.uid(),'gestor') OR created_by = auth.uid());
CREATE POLICY "Admin gestor delete trainings" ON public.trainings FOR DELETE TO authenticated
  USING (is_admin() OR has_role(auth.uid(),'gestor'));

CREATE TABLE public.training_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL,
  user_id UUID NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  score NUMERIC,
  certificate_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (training_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_participants TO authenticated;
GRANT ALL ON public.training_participants TO service_role;
ALTER TABLE public.training_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view training_participants" ON public.training_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gestor insert training_participants" ON public.training_participants FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin gestor update training_participants" ON public.training_participants FOR UPDATE TO authenticated
  USING (is_admin() OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin gestor delete training_participants" ON public.training_participants FOR DELETE TO authenticated
  USING (is_admin() OR has_role(auth.uid(),'gestor'));

-- ============== TRIGGERS (updated_at) ==============
CREATE TRIGGER trg_missions_updated BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_employee_contracts_updated BEFORE UPDATE ON public.employee_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_employee_leaves_updated BEFORE UPDATE ON public.employee_leaves FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_trainings_updated BEFORE UPDATE ON public.trainings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== INDEXES ==============
CREATE INDEX idx_missions_status ON public.missions(status);
CREATE INDEX idx_missions_dates ON public.missions(start_date, end_date);
CREATE INDEX idx_mp_mission ON public.mission_participants(mission_id);
CREATE INDEX idx_mp_user ON public.mission_participants(user_id);
CREATE INDEX idx_me_mission ON public.mission_expenses(mission_id);
CREATE INDEX idx_employees_active ON public.employees(is_active);
CREATE INDEX idx_employees_dept ON public.employees(department_id);
CREATE INDEX idx_contracts_employee ON public.employee_contracts(employee_id);
CREATE INDEX idx_leaves_employee ON public.employee_leaves(employee_id);
CREATE INDEX idx_leaves_status ON public.employee_leaves(status);
CREATE INDEX idx_tp_training ON public.training_participants(training_id);
CREATE INDEX idx_tp_user ON public.training_participants(user_id);
