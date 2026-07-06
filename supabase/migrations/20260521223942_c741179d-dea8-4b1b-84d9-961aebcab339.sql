
-- ============ ENUMS ============
CREATE TYPE public.document_status AS ENUM ('rascunho','submetido','aprovado','rejeitado','arquivado');
CREATE TYPE public.document_visibility AS ENUM ('publico','departamento','privado');
CREATE TYPE public.process_status AS ENUM ('aberto','em_curso','concluido','cancelado');
CREATE TYPE public.process_priority AS ENUM ('baixa','normal','alta','urgente');
CREATE TYPE public.process_step_status AS ENUM ('pendente','em_curso','concluida','devolvida');
CREATE TYPE public.process_event_type AS ENUM ('aberto','atribuido','avancado','devolvido','comentario','anexo','fechado','cancelado');

-- ============ DOCUMENT CATEGORIES ============
CREATE TABLE public.document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view categories" ON public.document_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages categories" ON public.document_categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.document_categories (name, icon, sort_order) VALUES
  ('Procedimentos','FileText',1),
  ('Manuais','BookOpen',2),
  ('Certificados','Award',3),
  ('Relatórios','FileBarChart',4),
  ('Legislação Interna','Scale',5),
  ('Outros','File',6);

-- ============ DOCUMENTS ============
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES public.document_categories(id) ON DELETE SET NULL,
  current_version_id uuid,
  owner_id uuid NOT NULL,
  status public.document_status NOT NULL DEFAULT 'rascunho',
  visibility public.document_visibility NOT NULL DEFAULT 'publico',
  expiry_date date,
  reviewer_id uuid,
  reviewed_at timestamptz,
  review_notes text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_owner ON public.documents(owner_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_expiry ON public.documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_documents_tags ON public.documents USING GIN(tags);

CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DOCUMENT VERSIONS ============
CREATE TABLE public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid NOT NULL,
  change_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, version_number)
);
CREATE INDEX idx_doc_versions_document ON public.document_versions(document_id);

-- ============ DOCUMENT PERMISSIONS ============
CREATE TABLE public.document_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  role public.app_role,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  can_edit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (role IS NOT NULL OR department_id IS NOT NULL)
);
CREATE INDEX idx_doc_perms_document ON public.document_permissions(document_id);

-- ============ DOCUMENT LINKS ============
CREATE TABLE public.document_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_doc_links_entity ON public.document_links(entity_type, entity_id);
CREATE INDEX idx_doc_links_document ON public.document_links(document_id);

-- ============ DOCUMENT ACCESS HELPER ============
CREATE OR REPLACE FUNCTION public.can_view_document(_doc_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = _doc_id
      AND (
        public.is_admin()
        OR d.owner_id = _user_id
        OR d.reviewer_id = _user_id
        OR (d.visibility = 'publico' AND d.status = 'aprovado')
        OR EXISTS (
          SELECT 1 FROM public.document_permissions dp
          WHERE dp.document_id = d.id
            AND (
              (dp.role IS NOT NULL AND public.has_role(_user_id, dp.role))
              OR (dp.department_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.user_departments ud
                WHERE ud.user_id = _user_id AND ud.department_id = dp.department_id
              ))
            )
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_document(_doc_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = _doc_id
      AND (
        public.is_admin()
        OR d.owner_id = _user_id
        OR EXISTS (
          SELECT 1 FROM public.document_permissions dp
          WHERE dp.document_id = d.id AND dp.can_edit = true
            AND (
              (dp.role IS NOT NULL AND public.has_role(_user_id, dp.role))
              OR (dp.department_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.user_departments ud
                WHERE ud.user_id = _user_id AND ud.department_id = dp.department_id
              ))
            )
        )
      )
  );
$$;

-- ============ DOCUMENT RLS ============
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View documents per permissions" ON public.documents FOR SELECT TO authenticated
  USING (public.can_view_document(id, auth.uid()));
CREATE POLICY "Authenticated can insert own documents" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner or editor can update documents" ON public.documents FOR UPDATE TO authenticated
  USING (public.can_edit_document(id, auth.uid()));
CREATE POLICY "Owner or admin can delete documents" ON public.documents FOR DELETE TO authenticated
  USING (public.is_admin() OR owner_id = auth.uid());

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View versions if can view doc" ON public.document_versions FOR SELECT TO authenticated
  USING (public.can_view_document(document_id, auth.uid()));
CREATE POLICY "Insert versions if can edit doc" ON public.document_versions FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_document(document_id, auth.uid()) AND uploaded_by = auth.uid());
CREATE POLICY "Delete versions if admin or owner" ON public.document_versions FOR DELETE TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.owner_id = auth.uid()));

ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View perms if can view doc" ON public.document_permissions FOR SELECT TO authenticated
  USING (public.can_view_document(document_id, auth.uid()));
CREATE POLICY "Owner or admin manages perms" ON public.document_permissions FOR ALL TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.owner_id = auth.uid()))
  WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.owner_id = auth.uid()));

ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View links if can view doc" ON public.document_links FOR SELECT TO authenticated
  USING (public.can_view_document(document_id, auth.uid()));
CREATE POLICY "Insert links if can view doc" ON public.document_links FOR INSERT TO authenticated
  WITH CHECK (public.can_view_document(document_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Delete own links or admin" ON public.document_links FOR DELETE TO authenticated
  USING (public.is_admin() OR created_by = auth.uid());

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('documents','documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can read documents bucket"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated can upload to documents bucket"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner or admin can delete documents files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND (public.is_admin() OR auth.uid()::text = (storage.foldername(name))[1]));

-- ============ PROCESS TYPES ============
CREATE TABLE public.process_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  sla_days int,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_process_types_updated_at BEFORE UPDATE ON public.process_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.process_type_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_type_id uuid NOT NULL REFERENCES public.process_types(id) ON DELETE CASCADE,
  order_index int NOT NULL,
  name text NOT NULL,
  default_role public.app_role,
  sla_days int,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(process_type_id, order_index)
);

ALTER TABLE public.process_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view process_types" ON public.process_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages process_types" ON public.process_types FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.process_type_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view type_steps" ON public.process_type_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages type_steps" ON public.process_type_steps FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ PROCESSES ============
CREATE TABLE public.processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type_id uuid NOT NULL REFERENCES public.process_types(id),
  title text NOT NULL,
  description text,
  requester_id uuid NOT NULL,
  current_step_id uuid,
  status public.process_status NOT NULL DEFAULT 'aberto',
  priority public.process_priority NOT NULL DEFAULT 'normal',
  due_date date,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  linked_entity_type text,
  linked_entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_processes_status ON public.processes(status);
CREATE INDEX idx_processes_type ON public.processes(type_id);
CREATE INDEX idx_processes_requester ON public.processes(requester_id);
CREATE INDEX idx_processes_linked ON public.processes(linked_entity_type, linked_entity_id);
CREATE TRIGGER trg_processes_updated_at BEFORE UPDATE ON public.processes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate process code: PRC-YYYY-NNNN
CREATE SEQUENCE IF NOT EXISTS public.process_code_seq;

CREATE OR REPLACE FUNCTION public.generate_process_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'PRC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.process_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_processes_code BEFORE INSERT ON public.processes
  FOR EACH ROW EXECUTE FUNCTION public.generate_process_code();

CREATE TABLE public.process_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  type_step_id uuid REFERENCES public.process_type_steps(id) ON DELETE SET NULL,
  order_index int NOT NULL,
  name text NOT NULL,
  assignee_user_id uuid,
  assignee_role public.app_role,
  status public.process_step_status NOT NULL DEFAULT 'pendente',
  started_at timestamptz,
  completed_at timestamptz,
  due_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_steps_process ON public.process_steps(process_id);
CREATE INDEX idx_steps_assignee ON public.process_steps(assignee_user_id);

CREATE TABLE public.process_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  step_id uuid REFERENCES public.process_steps(id) ON DELETE SET NULL,
  actor_id uuid,
  event_type public.process_event_type NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_process ON public.process_events(process_id, created_at DESC);

CREATE TABLE public.process_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  step_id uuid REFERENCES public.process_steps(id) ON DELETE SET NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  file_path text,
  label text NOT NULL,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_process ON public.process_attachments(process_id);

-- ============ PROCESS HELPERS ============
CREATE OR REPLACE FUNCTION public.is_process_actor(_process_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.processes p WHERE p.id = _process_id AND (
      p.requester_id = _user_id
      OR public.is_admin()
      OR public.has_role(_user_id, 'gestor')
      OR EXISTS (
        SELECT 1 FROM public.process_steps s
        WHERE s.process_id = p.id
          AND (s.assignee_user_id = _user_id
               OR (s.assignee_role IS NOT NULL AND public.has_role(_user_id, s.assignee_role)))
      )
    )
  );
$$;

-- ============ PROCESS RLS ============
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view processes" ON public.processes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin or gestor or requester insert processes" ON public.processes FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid() AND (public.is_admin() OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'tecnico') OR public.has_role(auth.uid(),'diretor') OR public.has_role(auth.uid(),'colaborador')));
CREATE POLICY "Actors update processes" ON public.processes FOR UPDATE TO authenticated
  USING (public.is_process_actor(id, auth.uid()));
CREATE POLICY "Admin or gestor delete processes" ON public.processes FOR DELETE TO authenticated
  USING (public.is_admin() OR public.has_role(auth.uid(),'gestor'));

ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view steps" ON public.process_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Actors insert steps" ON public.process_steps FOR INSERT TO authenticated
  WITH CHECK (public.is_process_actor(process_id, auth.uid()));
CREATE POLICY "Actors update steps" ON public.process_steps FOR UPDATE TO authenticated
  USING (public.is_process_actor(process_id, auth.uid()));
CREATE POLICY "Admin or gestor delete steps" ON public.process_steps FOR DELETE TO authenticated
  USING (public.is_admin() OR public.has_role(auth.uid(),'gestor'));

ALTER TABLE public.process_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view events" ON public.process_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Actors insert events" ON public.process_events FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND public.is_process_actor(process_id, auth.uid()));

ALTER TABLE public.process_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view attachments" ON public.process_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Actors insert attachments" ON public.process_attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND public.is_process_actor(process_id, auth.uid()));
CREATE POLICY "Uploader or admin delete attachments" ON public.process_attachments FOR DELETE TO authenticated
  USING (public.is_admin() OR uploaded_by = auth.uid());

-- ============ SEED PROCESS TYPES ============
DO $$
DECLARE
  t_id uuid;
BEGIN
  INSERT INTO public.process_types (name, description, icon, sla_days) VALUES
    ('Pedido de Análise Laboratorial','Solicitação interna de análise','FlaskConical',7) RETURNING id INTO t_id;
  INSERT INTO public.process_type_steps (process_type_id, order_index, name, default_role, sla_days) VALUES
    (t_id,1,'Submissão do pedido','colaborador',1),
    (t_id,2,'Triagem técnica','tecnico',1),
    (t_id,3,'Execução da análise','tecnico',4),
    (t_id,4,'Validação e entrega','gestor',1);

  INSERT INTO public.process_types (name, description, icon, sla_days) VALUES
    ('Tratamento de Não Conformidade','Workflow de tratamento de NC','AlertTriangle',14) RETURNING id INTO t_id;
  INSERT INTO public.process_type_steps (process_type_id, order_index, name, default_role, sla_days) VALUES
    (t_id,1,'Registo da NC','gestor',1),
    (t_id,2,'Análise de causa','gestor',3),
    (t_id,3,'Acção corretiva','gestor',7),
    (t_id,4,'Verificação','diretor',3);

  INSERT INTO public.process_types (name, description, icon, sla_days) VALUES
    ('Pedido de Parecer Técnico','Solicitação de parecer','FileSearch',10) RETURNING id INTO t_id;
  INSERT INTO public.process_type_steps (process_type_id, order_index, name, default_role, sla_days) VALUES
    (t_id,1,'Submissão','colaborador',1),
    (t_id,2,'Análise técnica','tecnico',5),
    (t_id,3,'Aprovação','diretor',4);

  INSERT INTO public.process_types (name, description, icon, sla_days) VALUES
    ('Licenciamento Sanitário','Processo de licenciamento','BadgeCheck',30) RETURNING id INTO t_id;
  INSERT INTO public.process_type_steps (process_type_id, order_index, name, default_role, sla_days) VALUES
    (t_id,1,'Recepção do pedido','gestor',2),
    (t_id,2,'Inspecção','tecnico',10),
    (t_id,3,'Parecer técnico','tecnico',5),
    (t_id,4,'Decisão','diretor',13);

  INSERT INTO public.process_types (name, description, icon, sla_days) VALUES
    ('Requisição de Insumos','Pedido de material/reagentes','PackagePlus',5) RETURNING id INTO t_id;
  INSERT INTO public.process_type_steps (process_type_id, order_index, name, default_role, sla_days) VALUES
    (t_id,1,'Pedido','tecnico',1),
    (t_id,2,'Aprovação','gestor',2),
    (t_id,3,'Entrega','gestor',2);

  INSERT INTO public.process_types (name, description, icon, sla_days) VALUES
    ('Aprovação de Lote de Produção','Aprovação para distribuição','PackageCheck',7) RETURNING id INTO t_id;
  INSERT INTO public.process_type_steps (process_type_id, order_index, name, default_role, sla_days) VALUES
    (t_id,1,'Submissão do lote','gestor',1),
    (t_id,2,'Controlo de qualidade','tecnico',4),
    (t_id,3,'Aprovação final','diretor',2);
END $$;

-- ============ ROLE PERMISSIONS SEED (RBAC matrix) ============
INSERT INTO public.role_permissions (role, module, can_view, can_write) VALUES
  ('admin','documentos',true,true),
  ('diretor','documentos',true,false),
  ('gestor','documentos',true,true),
  ('tecnico','documentos',true,true),
  ('colaborador','documentos',true,false),
  ('admin','processos',true,true),
  ('diretor','processos',true,false),
  ('gestor','processos',true,true),
  ('tecnico','processos',true,true),
  ('colaborador','processos',true,true)
ON CONFLICT DO NOTHING;
