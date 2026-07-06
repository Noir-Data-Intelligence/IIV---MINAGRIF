import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { Paginated } from "@/types/dto/paginated";
import type { HeroSlideDto, HeroSlideListParams } from "@/types/dto/heroSlide";

/**
 * Serviço de dados do módulo Hero Slides.
 *
 * Segue o mesmo padrão de `services/api/noticias.ts`: assenta nos helpers de
 * `client.ts` e nunca conhece o axios/MSW directamente.
 *
 * `listHeroSlides` continua a ser a leitura PÚBLICA (só slides publicados,
 * sem paginação) consumida por `HeroSlideshow.tsx` — não se altera. As
 * funções abaixo são a extensão CRUD do módulo, usadas pela página admin
 * (`src/pages/admin/Slideshow.tsx`).
 */
export function listHeroSlides(): Promise<HeroSlideDto[]> {
  return apiGet<HeroSlideDto[]>(endpoints.heroSlides.list);
}

/** Converte `HeroSlideListParams` em query params REST (snake_case p/ Laravel). */
function toQuery(params: HeroSlideListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  return query;
}

/** Listagem ADMIN: todos os slides (publicados ou não), paginada. */
export function listHeroSlidesAdmin(params: HeroSlideListParams): Promise<Paginated<HeroSlideDto>> {
  return apiGet<Paginated<HeroSlideDto>>(endpoints.heroSlides.admin, {
    params: toQuery(params),
  });
}

export function createHeroSlide(payload: Partial<HeroSlideDto>): Promise<HeroSlideDto> {
  return apiPost<HeroSlideDto>(endpoints.heroSlides.list, payload);
}

export function updateHeroSlide(id: string, payload: Partial<HeroSlideDto>): Promise<HeroSlideDto> {
  return apiPut<HeroSlideDto>(endpoints.heroSlides.detail(id), payload);
}

export function deleteHeroSlide(id: string): Promise<void> {
  return apiDelete<void>(endpoints.heroSlides.detail(id));
}
