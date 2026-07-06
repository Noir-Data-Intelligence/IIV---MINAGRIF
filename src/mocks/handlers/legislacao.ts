import { http, HttpResponse } from "msw";
import { legislacaoFixtures } from "@/mocks/fixtures/legislacao";
import type { LegislacaoDto } from "@/types/dto/legislacao";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Legislação.
 *
 * O GET de lista serve DOIS formatos a partir do MESMO endpoint, consoante o
 * cliente envie ou não `page`/`per_page`:
 *  - sem `page`/`per_page` (como faz `listLegislacao`, usado pelas páginas
 *    públicas `Legislacao.tsx`/`LegislacaoDetalhe.tsx`): array simples, tal
 *    como sempre devolveu — preserva o comportamento existente;
 *  - com `page`/`per_page` (como faz `listLegislacaoAdmin`, usado por
 *    `pages/admin/Legislacao.tsx` via `<DataTable>`): envelope
 *    `Paginated<LegislacaoDto>`, replicando a lógica de paginação/filtragem
 *    de `mocks/handlers/noticias.ts`/`mocks/handlers/departamentos.ts`.
 *
 * create/update/delete operam sobre `legislacaoFixtures` (array mutável em
 * memória, ver `mocks/fixtures/legislacao.ts`), pelo que PERSISTEM durante a
 * sessão do browser (reset no refresh). Os paths usam o wildcard `*` no
 * início para casar independentemente do host/porta configurado em `http.ts`.
 */

const BASE = "*/api/legislacao";

function toBool(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export const legislacaoHandlers = [
  // GET /api/legislacao -> lista filtrada (tipo/search/published); array simples
  // OU envelope paginado, consoante `page`/`per_page` estejam presentes (ver nota acima).
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const perPageParam = url.searchParams.get("per_page");
    const tipo = url.searchParams.get("tipo") ?? "";
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const published = toBool(url.searchParams.get("published"));

    // Ordenação idêntica à página actual: `.order("num")`.
    let rows = [...legislacaoFixtures].sort((a, b) =>
      a.num.localeCompare(b.num, undefined, { numeric: true }),
    );

    if (tipo) {
      rows = rows.filter((l) => l.tipo === tipo);
    }
    if (search) {
      rows = rows.filter(
        (l) =>
          l.titulo.toLowerCase().includes(search) ||
          (l.descricao ?? "").toLowerCase().includes(search),
      );
    }
    if (typeof published === "boolean") {
      rows = rows.filter((l) => l.published === published);
    }

    if (pageParam === null && perPageParam === null) {
      return HttpResponse.json(rows satisfies LegislacaoDto[]);
    }

    const page = Number(pageParam ?? "1") || 1;
    const perPage = Number(perPageParam ?? "20") || 20;
    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<LegislacaoDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // GET /api/legislacao/:slug -> item ou 404
  http.get(`${BASE}/:slug`, ({ params }) => {
    const { slug } = params as { slug: string };
    const item = legislacaoFixtures.find((l) => l.slug === slug || l.id === slug);
    if (!item) {
      return HttpResponse.json({ message: "Diploma não encontrado." }, { status: 404 });
    }
    return HttpResponse.json(item);
  }),

  // POST /api/legislacao -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<LegislacaoDto>;
    const titulo = payload.titulo ?? "Sem título";
    const slug = payload.slug?.trim() || slugify(titulo);
    const created: LegislacaoDto = {
      id: `leg-${Date.now()}`,
      num: payload.num ?? "",
      slug,
      titulo,
      descricao: payload.descricao ?? null,
      tipo: payload.tipo ?? "Lei",
      ano: payload.ano ?? "",
      pdfUrl: payload.pdfUrl ?? null,
      published: payload.published ?? false,
    };
    legislacaoFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/legislacao/:slug -> actualiza em memória (mesmo param usado pelo GET de detalhe)
  http.put(`${BASE}/:slug`, async ({ params, request }) => {
    const { slug } = params as { slug: string };
    const index = legislacaoFixtures.findIndex((l) => l.slug === slug || l.id === slug);
    if (index === -1) {
      return HttpResponse.json({ message: "Diploma não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<LegislacaoDto>;
    const updated: LegislacaoDto = {
      ...legislacaoFixtures[index],
      ...payload,
      // id/slug são imutáveis pelo cliente.
      id: legislacaoFixtures[index].id,
      slug: legislacaoFixtures[index].slug,
    };
    legislacaoFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/legislacao/:slug -> remove em memória
  http.delete(`${BASE}/:slug`, ({ params }) => {
    const { slug } = params as { slug: string };
    const index = legislacaoFixtures.findIndex((l) => l.slug === slug || l.id === slug);
    if (index === -1) {
      return HttpResponse.json({ message: "Diploma não encontrado." }, { status: 404 });
    }
    legislacaoFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default legislacaoHandlers;
