import { http, HttpResponse } from "msw";
import { heroSlidesFixtures } from "@/mocks/fixtures/heroSlides";
import type { HeroSlideDto } from "@/types/dto/heroSlide";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Hero Slides.
 *
 * Segue o mesmo padrão de `mocks/handlers/noticias.ts`: path com wildcard `*`
 * no início para casar independentemente da baseURL exacta configurada em
 * `http.ts`.
 *
 * Dois consumidores agora:
 *  - `HeroSlideshow.tsx` (público): `GET /api/hero-slides` — só slides
 *    publicados, sem paginação. Handler INALTERADO.
 *  - `pages/admin/Slideshow.tsx` (admin): `GET /api/hero-slides/admin`
 *    (todos os slides, paginado) + POST/PUT/DELETE, operando sobre
 *    `heroSlidesFixtures` (array mutável em memória) — create/update/delete
 *    PERSISTEM durante a sessão do browser (reset no refresh).
 */

const BASE = "*/api/hero-slides";

export const heroSlidesHandlers = [
  // GET /api/hero-slides/admin -> todos os slides (publicados ou não), paginado + filtrado
  // Regista-se ANTES do GET público (mais específico primeiro), embora `*/api/hero-slides`
  // seja um match exacto de path e não colida com `/api/hero-slides/admin`.
  http.get(`${BASE}/admin`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();

    let rows = [...heroSlidesFixtures].sort((a, b) => a.sortOrder - b.sortOrder);

    if (search) {
      rows = rows.filter(
        (s) =>
          s.kicker.toLowerCase().includes(search) ||
          s.title.toLowerCase().includes(search) ||
          s.subtitle.toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<HeroSlideDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // GET /api/hero-slides -> slides publicados, ordenados por sortOrder (PÚBLICO, inalterado)
  http.get(BASE, () => {
    const data: HeroSlideDto[] = heroSlidesFixtures
      .filter((s) => s.published)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return HttpResponse.json(data);
  }),

  // POST /api/hero-slides -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<HeroSlideDto>;
    const maxOrder = heroSlidesFixtures.reduce((m, s) => Math.max(m, s.sortOrder), 0);
    const created: HeroSlideDto = {
      id: `hs-${Date.now()}`,
      kicker: payload.kicker ?? "",
      title: payload.title ?? "",
      subtitle: payload.subtitle ?? "",
      ctaLabel: payload.ctaLabel ?? "",
      ctaLink: payload.ctaLink ?? "",
      imageUrl: payload.imageUrl ?? null,
      sortOrder: payload.sortOrder ?? maxOrder + 1,
      published: payload.published ?? true,
    };
    heroSlidesFixtures.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/hero-slides/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = heroSlidesFixtures.findIndex((s) => s.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Slide não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<HeroSlideDto>;
    const updated: HeroSlideDto = {
      ...heroSlidesFixtures[index],
      ...payload,
      // id é imutável pelo cliente.
      id: heroSlidesFixtures[index].id,
    };
    heroSlidesFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/hero-slides/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = heroSlidesFixtures.findIndex((s) => s.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Slide não encontrado." }, { status: 404 });
    }
    heroSlidesFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default heroSlidesHandlers;
