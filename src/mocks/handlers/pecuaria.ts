import { http, HttpResponse } from "msw";
import { producaoFixtures } from "@/mocks/fixtures/pecuaria";
import type { ProdDto } from "@/types/dto/pecuaria";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Produção Pecuária — recurso `producao-pecuaria`.
 *
 * Opera sobre `producaoFixtures` (array mutável em memória), pelo que as
 * escritas PERSISTEM durante a sessão do browser (reset no refresh). Segue a
 * lógica de paginação/filtragem de `handlers/departamentos.ts`.
 */

const BASE = "*/api/producao-pecuaria";

export const pecuariaHandlers = [
  // GET /api/producao-pecuaria -> lista paginada + filtrada, ordenada por data (desc)
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const stationId = url.searchParams.get("station_id") ?? "";
    const productType = url.searchParams.get("product_type") ?? "";

    let rows = [...producaoFixtures].sort((a, b) =>
      b.productionDate.localeCompare(a.productionDate),
    );

    if (search) {
      rows = rows.filter(
        (p) =>
          p.productType.toLowerCase().includes(search) ||
          (p.recordedBy ?? "").toLowerCase().includes(search) ||
          (p.notes ?? "").toLowerCase().includes(search) ||
          p.unit.toLowerCase().includes(search),
      );
    }
    if (stationId) rows = rows.filter((p) => p.stationId === stationId);
    if (productType) rows = rows.filter((p) => p.productType === productType);

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;

    const body: Paginated<ProdDto> = {
      data: rows.slice(start, start + perPage),
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/producao-pecuaria -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<ProdDto>;
    const created: ProdDto = {
      id: `prod-${Date.now()}`,
      stationId: payload.stationId ?? "",
      productType: payload.productType ?? "Outro",
      productionDate: payload.productionDate ?? new Date().toISOString().slice(0, 10),
      quantity: Number(payload.quantity ?? 0),
      unit: payload.unit ?? "kg",
      recordedBy: payload.recordedBy ?? null,
      notes: payload.notes ?? null,
      createdAt: new Date().toISOString(),
    };
    producaoFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/producao-pecuaria/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = producaoFixtures.findIndex((p) => p.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Registo de produção não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<ProdDto>;
    const updated: ProdDto = {
      ...producaoFixtures[index],
      ...payload,
      quantity: payload.quantity !== undefined ? Number(payload.quantity) : producaoFixtures[index].quantity,
      id: producaoFixtures[index].id,
      createdAt: producaoFixtures[index].createdAt,
    };
    producaoFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/producao-pecuaria/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = producaoFixtures.findIndex((p) => p.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Registo de produção não encontrado." }, { status: 404 });
    }
    producaoFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default pecuariaHandlers;
