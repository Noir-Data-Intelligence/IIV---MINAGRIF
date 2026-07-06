
-- 1. Add 'submetida' to mission_status enum
ALTER TYPE public.mission_status ADD VALUE IF NOT EXISTS 'submetida' BEFORE 'aprovada';

-- 2. Add report_url to mission_reports
ALTER TABLE public.mission_reports ADD COLUMN IF NOT EXISTS report_url text;

-- 3. Seed Missão de Serviço process type + steps
DO $$
DECLARE
  v_type_id uuid;
BEGIN
  SELECT id INTO v_type_id FROM public.process_types WHERE name='Missão de Serviço';
  IF v_type_id IS NULL THEN
    INSERT INTO public.process_types(name, description, icon, sla_days, is_active)
    VALUES ('Missão de Serviço', 'Aprovação de missões de serviço (deslocações)', 'Plane', 8, true)
    RETURNING id INTO v_type_id;

    INSERT INTO public.process_type_steps(process_type_id, order_index, name, default_role, sla_days) VALUES
      (v_type_id, 1, 'Validação do Chefe de Departamento', 'gestor', 2),
      (v_type_id, 2, 'Aprovação Financeira', 'gestor', 2),
      (v_type_id, 3, 'Aprovação da Direcção', 'diretor', 3),
      (v_type_id, 4, 'Emissão de Guia de Marcha', 'admin', 1);
  END IF;
END $$;

-- 4. Trigger: sync mission status from BPM process
CREATE OR REPLACE FUNCTION public.sync_mission_status_from_process()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.mission_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'concluido' THEN
      UPDATE public.missions SET status='aprovada' WHERE id=NEW.mission_id AND status IN ('planeada','submetida');
    ELSIF NEW.status = 'cancelado' THEN
      UPDATE public.missions SET status='planeada' WHERE id=NEW.mission_id AND status='submetida';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_mission_status ON public.processes;
CREATE TRIGGER trg_sync_mission_status
AFTER UPDATE ON public.processes
FOR EACH ROW EXECUTE FUNCTION public.sync_mission_status_from_process();
