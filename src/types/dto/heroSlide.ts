/**
 * DTO de Hero Slide — contrato exacto do JSON REST para o recurso `hero-slides`.
 *
 * Espelha a tabela Supabase `hero_slides` (colunas `image_url`, `cta_label`,
 * `cta_link`, `sort_order`), mas em camelCase, seguindo a convenção adoptada
 * pelas API Resources do Laravel. O serviço (`services/api/heroSlides.ts`)
 * consome directamente esta forma — não há (de)serialização adicional.
 */
export interface HeroSlideDto {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  imageUrl: string | null;
  sortOrder: number;
  published: boolean;
}
