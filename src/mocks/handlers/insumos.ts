import { http, HttpResponse } from "msw";
import { insumosFixtures } from "@/mocks/fixtures/insumos";
import type { InsumoDto } from "@/types/dto/insumo";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Insumos (depende de laboratorios via laboratory_id).
 *
 * Operam sobre `insumosFixtures` (array mutável). Ordenação alfabética por nome.
 */
const BASE = "*/api/insumos";

export const insumosHandlers = [
  // GET /api/insumos -> lista paginada + filtrada
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const laboratoryId = url.searchParams.get("laboratory_id") ?? "";

    let rows = [...insumosFixtures].sort((a, b) => a.name.localeCompare(b.name));

    if (search) {
      rows = rows.filter(
        (s) => s.name.toLowerCase().includes(search) || s.unit.toLowerCase().includes(search),
      );
    }
    if (laboratoryId) rows = rows.filter((s) => s.laboratoryId === laboratoryId);

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<InsumoDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/insumos -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<InsumoDto>;
    const created: InsumoDto = {
      id: `ins-${Date.now()}`,
      laboratoryId: payload.laboratoryId ?? "",
      name: payload.name ?? "Sem nome",
      quantity: payload.quantity ?? 0,
      unit: payload.unit ?? "unidade",
      minStock: payload.minStock ?? 0,
      expiryDate: payload.expiryDate ?? null,
    };
    insumosFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/insumos/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = insumosFixtures.findIndex((s) => s.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Insumo não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<InsumoDto>;
    const updated: InsumoDto = {
      ...insumosFixtures[index],
      ...payload,
      id: insumosFixtures[index].id,
    };
    insumosFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/insumos/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = insumosFixtures.findIndex((s) => s.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Insumo não encontrado." }, { status: 404 });
    }
    insumosFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default insumosHandlers;
