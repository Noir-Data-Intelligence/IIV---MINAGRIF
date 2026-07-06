-- 1) Remover políticas SELECT amplas em storage.objects para buckets públicos
-- (ficheiros continuam acessíveis via URL público; só impedimos listagem)
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Public can read slideshow images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view legislation PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Public can view noticias images" ON storage.objects;

-- 2) Revogar SELECT do role `anon` em tabelas que não devem ser descobertas
-- antes do login (mantemos as 7 tabelas usadas pelo portal público + LiveStats)
DO $$
DECLARE
  t text;
  keep_anon text[] := ARRAY[
    'hero_slides', 'legislation', 'noticias',
    'products', 'production_batches', 'stations', 'quality_audits',
    'contact_messages'  -- INSERT permanece; SELECT será revogado abaixo
  ];
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> ALL(keep_anon)
  LOOP
    EXECUTE format('REVOKE SELECT ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- contact_messages: anon pode inserir, mas não ler nem listar
REVOKE SELECT ON public.contact_messages FROM anon;

-- 3) Garantir grants explícitos onde anon precisa de leitura
GRANT SELECT ON public.hero_slides       TO anon;
GRANT SELECT ON public.legislation       TO anon;
GRANT SELECT ON public.noticias          TO anon;
GRANT SELECT ON public.products          TO anon;
GRANT SELECT ON public.production_batches TO anon;
GRANT SELECT ON public.stations          TO anon;
GRANT SELECT ON public.quality_audits    TO anon;