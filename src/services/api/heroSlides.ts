import { apiGet } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { HeroSlideDto } from "@/types/dto/heroSlide";

/**
 * Serviço de dados do módulo Hero Slides.
 *
 * Segue o mesmo padrão de `services/api/noticias.ts`: assenta nos helpers de
 * `client.ts` e nunca conhece o axios/MSW directamente.
 */
export function listHeroSlides(): Promise<HeroSlideDto[]> {
  return apiGet<HeroSlideDto[]>(endpoints.heroSlides.list);
}
