import { http, HttpResponse } from "msw";
import { departamentosFixtures } from "@/mocks/fixtures/departamentos";
import type { DepartamentoDto } from "@/types/dto/departamento";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Departamentos.
 *
 * Operam sobre `departamentosFixtures` (array mutável em memória), pelo que
 * create/update/delete PERSISTEM durante a sessão do browser (reset no refresh).
 *
 * Os paths usam o wildcard `*` no início (padrão recomendado pela documentação
 * MSW) para casar independentemente da baseURL exacta configurada em http.ts.
 * Replica a lógica de paginação/filtragem de `mocks/handlers/noticias.ts`.
 */

const BASE = "*/api/departamentos";

export const departamentosHandlers = [
  // GET /api/departamentos -> lista paginada + filtrada, ordenada por nome
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();

    // Ordenação alfabética por nome (locale-aware).
    let rows = [...departamentosFixtures].sort((a, b) => a.name.localeCompare(b.name));

    if (search) {
      rows = rows.filter(
        (d) =>
          d.name.toLowerCase().includes(search) ||
          (d.description ?? "").toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<DepartamentoDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/departamentos -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<DepartamentoDto>;
    const now = new Date().toISOString();
    const created: DepartamentoDto = {
      id: `dep-${Date.now()}`,
      name: payload.name ?? "Sem nome",
      description: payload.description ?? null,
      parentId: payload.parentId ?? null,
      createdAt: now,
    };
    departamentosFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/departamentos/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = departamentosFixtures.findIndex((d) => d.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Departamento não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<DepartamentoDto>;
    const updated: DepartamentoDto = {
      ...departamentosFixtures[index],
      ...payload,
      // id/createdAt são imutáveis pelo cliente.
      id: departamentosFixtures[index].id,
      createdAt: departamentosFixtures[index].createdAt,
    };
    departamentosFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/departamentos/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = departamentosFixtures.findIndex((d) => d.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Departamento não encontrado." }, { status: 404 });
    }
    departamentosFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default departamentosHandlers;
