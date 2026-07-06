import { http, HttpResponse } from "msw";
import { laboratoriosFixtures } from "@/mocks/fixtures/laboratorios";
import type { LaboratorioDto } from "@/types/dto/laboratorio";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Laboratórios.
 *
 * Operam sobre `laboratoriosFixtures` (array mutável em memória) — create/update/delete
 * persistem durante a sessão do browser (reset no refresh). Replica a lógica de
 * paginação/filtragem de `mocks/handlers/departamentos.ts`.
 */
const BASE = "*/api/laboratorios";

export const laboratoriosHandlers = [
  // GET /api/laboratorios -> lista paginada + filtrada, ordenada por nome
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();

    let rows = [...laboratoriosFixtures].sort((a, b) => a.name.localeCompare(b.name));

    if (search) {
      rows = rows.filter(
        (l) =>
          l.name.toLowerCase().includes(search) ||
          l.type.toLowerCase().includes(search) ||
          (l.description ?? "").toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<LaboratorioDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/laboratorios -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<LaboratorioDto>;
    const created: LaboratorioDto = {
      id: `lab-${Date.now()}`,
      name: payload.name ?? "Sem nome",
      type: payload.type ?? "geral",
      description: payload.description ?? null,
      isActive: payload.isActive ?? true,
      createdAt: new Date().toISOString(),
    };
    laboratoriosFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/laboratorios/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = laboratoriosFixtures.findIndex((l) => l.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Laboratório não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<LaboratorioDto>;
    const updated: LaboratorioDto = {
      ...laboratoriosFixtures[index],
      ...payload,
      id: laboratoriosFixtures[index].id,
      createdAt: laboratoriosFixtures[index].createdAt,
    };
    laboratoriosFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/laboratorios/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = laboratoriosFixtures.findIndex((l) => l.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Laboratório não encontrado." }, { status: 404 });
    }
    laboratoriosFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default laboratoriosHandlers;
