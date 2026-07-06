
-- Tabela de notícias do portal público
CREATE TABLE public.noticias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  resumo TEXT,
  conteudo TEXT,
  categoria TEXT NOT NULL DEFAULT 'Geral',
  image_path TEXT,
  destaque BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  author_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_noticias_published_at ON public.noticias (published_at DESC);
CREATE INDEX idx_noticias_categoria ON public.noticias (categoria);

ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published noticias"
  ON public.noticias FOR SELECT
  USING ((published = true) OR is_admin());

CREATE POLICY "Admins can insert noticias"
  ON public.noticias FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update noticias"
  ON public.noticias FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete noticias"
  ON public.noticias FOR DELETE
  USING (is_admin());

CREATE TRIGGER update_noticias_updated_at
  BEFORE UPDATE ON public.noticias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket público para imagens das notícias
INSERT INTO storage.buckets (id, name, public) VALUES ('noticias', 'noticias', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view noticias images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'noticias');

CREATE POLICY "Admins can upload noticias images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'noticias' AND is_admin());

CREATE POLICY "Admins can update noticias images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'noticias' AND is_admin());

CREATE POLICY "Admins can delete noticias images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'noticias' AND is_admin());
