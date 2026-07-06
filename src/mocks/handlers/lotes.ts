import { http, HttpResponse } from "msw";
import { lotesFixtures } from "@/mocks/fixtures/lotes";
import { produtosFixtures } from "@/mocks/fixtures/produtos";
import type { LoteDto } from "@/types/dto/lote";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Lotes. Ordena por data de produção (desc), suporta
 * pesquisa (nº de lote / notas / nome do produto) e filtro por `product_id`.
 * Escrita persistida em memória durante a sessão do browser.
 */

const BASE = "*/api/lotes";

/** Nome do produto resolvido a partir das fixtures, para pesquisa textual. */
function productName(productId: string): string {
  return produtosFixtures.find((p) => p.id === productId)?.name ?? "";
}

export const lotesHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const productId = url.searchParams.get("product_id");

    let rows = [...lotesFixtures].sort((a, b) => b.productionDate.localeCompare(a.productionDate));

    if (productId) rows = rows.filter((l) => l.productId === productId);

    if (search) {
      rows = rows.filter(
        (l) =>
          l.batchNumber.toLowerCase().includes(search) ||
          (l.notes ?? "").toLowerCase().includes(search) ||
          productName(l.productId).toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<LoteDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<LoteDto>;
    const now = new Date().toISOString();
    const created: LoteDto = {
      id: `lote-${Date.now()}`,
      batchNumber: payload.batchNumber ?? "SEM-NUM",
      productId: payload.productId ?? "",
      quantityProduced: payload.quantityProduced ?? 0,
      quantityDistributed: payload.quantityDistributed ?? 0,
      productionDate: payload.productionDate ?? now.slice(0, 10),
      expiryDate: payload.expiryDate ?? now.slice(0, 10),
      status: payload.status ?? "planeada",
      notes: payload.notes ?? null,
      createdAt: now,
    };
    lotesFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = lotesFixtures.findIndex((l) => l.id === id);
    if (index === -1) return HttpResponse.json({ message: "Lote não encontrado." }, { status: 404 });
    const payload = (await request.json().catch(() => ({}))) as Partial<LoteDto>;
    const updated: LoteDto = {
      ...lotesFixtures[index],
      ...payload,
      id: lotesFixtures[index].id,
      createdAt: lotesFixtures[index].createdAt,
    };
    lotesFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = lotesFixtures.findIndex((l) => l.id === id);
    if (index === -1) return HttpResponse.json({ message: "Lote não encontrado." }, { status: 404 });
    lotesFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default lotesHandlers;
