import { http, HttpResponse } from "msw";
import { estacoesFixtures } from "@/mocks/fixtures/estacoes";
import type { EstacaoDto } from "@/types/dto/estacao";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Estações.
 *
 * Modelado exactamente em `mocks/handlers/departamentos.ts`: operam sobre
 * `estacoesFixtures` (array mutável em memória) — create/update/delete PERSISTEM
 * durante a sessão do browser (reset no refresh). Wildcard `*` no início para
 * casar independentemente da baseURL configurada em http.ts.
 */
const BASE = "*/api/estacoes";

export const estacoesHandlers = [
  // GET /api/estacoes -> lista paginada + filtrada, ordenada por nome
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();

    let rows = [...estacoesFixtures].sort((a, b) => a.name.localeCompare(b.name));

    if (search) {
      rows = rows.filter(
        (e) =>
          e.name.toLowerCase().includes(search) ||
          (e.location ?? "").toLowerCase().includes(search) ||
          (e.description ?? "").toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<EstacaoDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/estacoes -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<EstacaoDto>;
    const now = new Date().toISOString();
    const created: EstacaoDto = {
      id: `est-${Date.now()}`,
      name: payload.name ?? "Sem nome",
      stationType: payload.stationType ?? "zootecnica",
      location: payload.location ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      description: payload.description ?? null,
      isActive: payload.isActive ?? true,
      createdAt: now,
    };
    estacoesFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/estacoes/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = estacoesFixtures.findIndex((e) => e.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Estação não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<EstacaoDto>;
    const updated: EstacaoDto = {
      ...estacoesFixtures[index],
      ...payload,
      id: estacoesFixtures[index].id,
      createdAt: estacoesFixtures[index].createdAt,
    };
    estacoesFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/estacoes/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = estacoesFixtures.findIndex((e) => e.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Estação não encontrada." }, { status: 404 });
    }
    estacoesFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default estacoesHandlers;
