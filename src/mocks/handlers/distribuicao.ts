import { http, HttpResponse } from "msw";
import { distribuicaoFixtures } from "@/mocks/fixtures/distribuicao";
import { lotesFixtures } from "@/mocks/fixtures/lotes";
import { produtosFixtures } from "@/mocks/fixtures/produtos";
import type { DistribuicaoDto } from "@/types/dto/distribuicao";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Distribuição. Ordena por data (desc), suporta pesquisa
 * (destino / notas / nº de lote / nome do produto, resolvidos transitivamente) e
 * filtro por `batch_id`. Escrita persistida em memória.
 */

const BASE = "*/api/distribuicao";

/** Texto pesquisável do lote associado (nº de lote + nome do produto). */
function batchSearchText(batchId: string): string {
  const lote = lotesFixtures.find((l) => l.id === batchId);
  if (!lote) return "";
  const produto = produtosFixtures.find((p) => p.id === lote.productId);
  return `${lote.batchNumber} ${produto?.name ?? ""}`.toLowerCase();
}

export const distribuicaoHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const batchId = url.searchParams.get("batch_id");

    let rows = [...distribuicaoFixtures].sort((a, b) => b.distributionDate.localeCompare(a.distributionDate));

    if (batchId) rows = rows.filter((d) => d.batchId === batchId);

    if (search) {
      rows = rows.filter(
        (d) =>
          d.destination.toLowerCase().includes(search) ||
          (d.notes ?? "").toLowerCase().includes(search) ||
          batchSearchText(d.batchId).includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<DistribuicaoDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<DistribuicaoDto>;
    const now = new Date().toISOString();
    const created: DistribuicaoDto = {
      id: `dist-${Date.now()}`,
      destination: payload.destination ?? "Sem destino",
      quantity: payload.quantity ?? 0,
      distributionDate: payload.distributionDate ?? now.slice(0, 10),
      notes: payload.notes ?? null,
      batchId: payload.batchId ?? "",
    };
    distribuicaoFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = distribuicaoFixtures.findIndex((d) => d.id === id);
    if (index === -1) return HttpResponse.json({ message: "Distribuição não encontrada." }, { status: 404 });
    const payload = (await request.json().catch(() => ({}))) as Partial<DistribuicaoDto>;
    const updated: DistribuicaoDto = {
      ...distribuicaoFixtures[index],
      ...payload,
      id: distribuicaoFixtures[index].id,
    };
    distribuicaoFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = distribuicaoFixtures.findIndex((d) => d.id === id);
    if (index === -1) return HttpResponse.json({ message: "Distribuição não encontrada." }, { status: 404 });
    distribuicaoFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default distribuicaoHandlers;
