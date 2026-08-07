import { http, HttpResponse } from "msw";
import { noticiasFixtures } from "@/mocks/fixtures/noticias";
import type { NoticiaDto } from "@/types/dto/noticia";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Notícias.
 *
 * Operam sobre `noticiasFixtures` (array mutável em memória), pelo que
 * create/update/delete PERSISTEM durante a sessão do browser (reset no refresh).
 *
 * Os paths usam o wildcard "*" no início (padrão recomendado pela documentação
 * MSW) para casar independentemente da baseURL exacta configurada em http.ts
 * (por omissão relativa, "/api"). Assim, o padrão wildcard + "/api/noticias"
 * intercepta o pedido real seja qual for o host/porta.
 */

const BASE = "*/api/noticias";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

function toBool(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}

export const noticiasHandlers = [
  // GET /api/noticias -> lista paginada + filtrada
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const categoria = url.searchParams.get("categoria") ?? "";
    const published = toBool(url.searchParams.get("published"));

    // Ordenação idêntica à das páginas: destaque, depois published_at, depois created_at (desc).
    let rows = [...noticiasFixtures].sort((a, b) => {
      if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
      const da = a.published_at ?? a.created_at;
      const db = b.published_at ?? b.created_at;
      return db.localeCompare(da);
    });

    if (search) {
      rows = rows.filter(
        (n) =>
          n.titulo.toLowerCase().includes(search) ||
          (n.resumo ?? "").toLowerCase().includes(search) ||
          (n.conteudo ?? "").toLowerCase().includes(search),
      );
    }
    if (categoria) {
      rows = rows.filter((n) => n.categoria === categoria);
    }
    if (typeof published === "boolean") {
      rows = rows.filter((n) => n.published === published);
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<NoticiaDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // GET /api/noticias/:id -> item ou 404
  http.get(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const item = noticiasFixtures.find((n) => n.id === id || n.slug === id);
    if (!item) {
      return HttpResponse.json({ message: "Notícia não encontrada." }, { status: 404 });
    }
    return HttpResponse.json(item);
  }),

  // POST /api/noticias -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<NoticiaDto>;
    const now = new Date().toISOString();
    const titulo = payload.titulo ?? "Sem título";
    const created: NoticiaDto = {
      id: `n-${Date.now()}`,
      slug: payload.slug || `${slugify(titulo)}-${Math.random().toString(36).slice(2, 6)}`,
      titulo,
      resumo: payload.resumo ?? null,
      conteudo: payload.conteudo ?? null,
      categoria: payload.categoria ?? "Geral",
      image_path: payload.image_path ?? null,
      destaque: payload.destaque ?? false,
      published: payload.published ?? false,
      published_at:
        payload.published_at ?? (payload.published ? now : null),
      created_at: now,
    };
    noticiasFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/noticias/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = noticiasFixtures.findIndex((n) => n.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Notícia não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<NoticiaDto>;
    const updated: NoticiaDto = {
      ...noticiasFixtures[index],
      ...payload,
      // id/created_at são imutáveis pelo cliente.
      id: noticiasFixtures[index].id,
      created_at: noticiasFixtures[index].created_at,
    };
    noticiasFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/noticias/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = noticiasFixtures.findIndex((n) => n.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Notícia não encontrada." }, { status: 404 });
    }
    noticiasFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default noticiasHandlers;
