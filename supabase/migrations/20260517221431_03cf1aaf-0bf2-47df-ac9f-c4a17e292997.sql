
CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kicker text NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL,
  cta_label text NOT NULL DEFAULT 'Saiba mais',
  cta_link text NOT NULL DEFAULT '/sobre',
  image_path text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published slides" ON public.hero_slides
  FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "Admins can insert slides" ON public.hero_slides
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update slides" ON public.hero_slides
  FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete slides" ON public.hero_slides
  FOR DELETE USING (is_admin());

CREATE TRIGGER hero_slides_updated_at BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_hero_slides_order ON public.hero_slides(sort_order);

INSERT INTO storage.buckets (id, name, public) VALUES ('slideshow', 'slideshow', true);

CREATE POLICY "Public can read slideshow images" ON storage.objects
  FOR SELECT USING (bucket_id = 'slideshow');
CREATE POLICY "Admins can upload slideshow images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'slideshow' AND is_admin());
CREATE POLICY "Admins can update slideshow images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'slideshow' AND is_admin());
CREATE POLICY "Admins can delete slideshow images" ON storage.objects
  FOR DELETE USING (bucket_id = 'slideshow' AND is_admin());

INSERT INTO public.hero_slides (kicker, title, subtitle, cta_label, cta_link, sort_order, published) VALUES
('Diagnóstico Laboratorial', 'Ciência ao serviço da saúde animal', 'Laboratórios de referência com padrões internacionais para o sector veterinário angolano.', 'Conheça os nossos serviços', '/servicos', 1, true),
('Produção de Vacinas', 'Vacinas e reagentes feitos em Angola', 'Produção nacional de imunobiológicos veterinários para reforçar a segurança alimentar.', 'Ver produção', '/servicos', 2, true),
('Saúde no Terreno', 'Presença em cada província', 'Oito estações regionais a apoiar criadores e médicos veterinários em todo o território.', 'Sobre o Instituto', '/sobre', 3, true),
('Investigação Científica', 'Investigação aplicada com impacto', 'Programas de pesquisa em parceria com universidades e organizações internacionais.', 'Saiba mais', '/sobre', 4, true),
('Vigilância Epidemiológica', 'Protegendo a pecuária nacional', 'Vigilância contínua de doenças animais que ameaçam a economia e a saúde pública.', 'Últimas notícias', '/noticias', 5, true);
