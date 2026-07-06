import { http, HttpResponse } from "msw";
import { heroSlidesFixtures } from "@/mocks/fixtures/heroSlides";
import type { HeroSlideDto } from "@/types/dto/heroSlide";

/**
 * Handlers MSW do módulo Hero Slides.
 *
 * Segue o mesmo padrão de `mocks/handlers/noticias.ts`: path com wildcard `*`
 * no início para casar independentemente da baseURL exacta configurada em
 * `http.ts`. Este módulo, por agora, só expõe leitura (só há um consumidor:
 * `HeroSlideshow.tsx`, que lê os slides publicados).
 */

const BASE = "*/api/hero-slides";

export const heroSlidesHandlers = [
  // GET /api/hero-slides -> slides publicados, ordenados por sortOrder
  http.get(BASE, () => {
    const data: HeroSlideDto[] = heroSlidesFixtures
      .filter((s) => s.published)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return HttpResponse.json(data);
  }),
];

export default heroSlidesHandlers;
