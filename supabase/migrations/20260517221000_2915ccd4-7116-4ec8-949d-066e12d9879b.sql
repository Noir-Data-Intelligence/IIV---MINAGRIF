
-- Legislation table
CREATE TABLE public.legislation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  num TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL,
  ano TEXT NOT NULL,
  pdf_path TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.legislation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published legislation"
  ON public.legislation FOR SELECT
  USING (published = true OR public.is_admin());

CREATE POLICY "Admins can insert legislation"
  ON public.legislation FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update legislation"
  ON public.legislation FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete legislation"
  ON public.legislation FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER update_legislation_updated_at
  BEFORE UPDATE ON public.legislation
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('legislation', 'legislation', true);

CREATE POLICY "Public can view legislation PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'legislation');

CREATE POLICY "Admins can upload legislation PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'legislation' AND public.is_admin());

CREATE POLICY "Admins can update legislation PDFs"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'legislation' AND public.is_admin());

CREATE POLICY "Admins can delete legislation PDFs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'legislation' AND public.is_admin());

-- Seed
INSERT INTO public.legislation (num, slug, titulo, descricao, tipo, ano) VALUES
  ('01', 'lei-bases-pecuaria', 'Lei de Bases da Pecuária', 'Quadro legal que rege a actividade pecuária em Angola.', 'Lei', '2018'),
  ('02', 'regulamento-servicos-veterinarios', 'Regulamento dos Serviços Veterinários', 'Normas que regulam os serviços de saúde animal a nível nacional.', 'Decreto', '2019'),
  ('03', 'normas-biosseguranca-laboratorial', 'Normas de Biossegurança Laboratorial', 'Requisitos de segurança para laboratórios veterinários.', 'Norma', '2021'),
  ('04', 'regulamento-producao-vacinas', 'Regulamento de Produção de Vacinas Veterinárias', 'Disposições sobre o fabrico e controlo de vacinas de uso veterinário.', 'Regulamento', '2020'),
  ('05', 'portaria-notificacao-doencas', 'Portaria sobre Notificação de Doenças Animais', 'Lista de doenças de notificação obrigatória e procedimentos.', 'Portaria', '2022'),
  ('06', 'decreto-importacao-produtos-biologicos', 'Decreto sobre Importação de Produtos Biológicos', 'Requisitos para importação de vacinas, soros e reagentes.', 'Decreto', '2023');
