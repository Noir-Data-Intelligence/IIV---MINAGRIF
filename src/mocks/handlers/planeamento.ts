import { http, HttpResponse } from "msw";
import { planeamentoFixtures } from "@/mocks/fixtures/planeamento";
import { produtosFixtures } from "@/mocks/fixtures/produtos";
import type { PlanoDto } from "@/types/dto/plano";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Planeamento. Ordena por data de início (desc), suporta
 * pesquisa (nome do produto / notas) e filtro por `product_id`. Escrita
 * persistida em memória.
 */

const BASE = "*/api/planeamento";

function productName(productId: string): string {
  return produtosFixtures.find((p) => p.id === productId)?.name ?? "";
}

export const planeamentoHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const productId = url.searchParams.get("product_id");

    let rows = [...planeamentoFixtures].sort((a, b) => b.plannedStart.localeCompare(a.plannedStart));

    if (productId) rows = rows.filter((p) => p.productId === productId);

    if (search) {
      rows = rows.filter(
        (p) =>
          productName(p.productId).toLowerCase().includes(search) ||
          (p.notes ?? "").toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<PlanoDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<PlanoDto>;
    const now = new Date().toISOString();
    const created: PlanoDto = {
      id: `plano-${Date.now()}`,
      productId: payload.productId ?? "",
      plannedQuantity: payload.plannedQuantity ?? 0,
      actualQuantity: payload.actualQuantity ?? null,
      plannedStart: payload.plannedStart ?? now.slice(0, 10),
      plannedEnd: payload.plannedEnd ?? now.slice(0, 10),
      status: payload.status ?? "planeada",
      notes: payload.notes ?? null,
    };
    planeamentoFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = planeamentoFixtures.findIndex((p) => p.id === id);
    if (index === -1) return HttpResponse.json({ message: "Plano não encontrado." }, { status: 404 });
    const payload = (await request.json().catch(() => ({}))) as Partial<PlanoDto>;
    const updated: PlanoDto = {
      ...planeamentoFixtures[index],
      ...payload,
      id: planeamentoFixtures[index].id,
    };
    planeamentoFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = planeamentoFixtures.findIndex((p) => p.id === id);
    if (index === -1) return HttpResponse.json({ message: "Plano não encontrado." }, { status: 404 });
    planeamentoFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default planeamentoHandlers;
