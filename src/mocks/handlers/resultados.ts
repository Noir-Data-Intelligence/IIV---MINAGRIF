import { http, HttpResponse } from "msw";
import { resultadosFixtures } from "@/mocks/fixtures/resultados";
import type { ResultadoDto } from "@/types/dto/resultado";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Resultados (lab_results, depende de analises via analysis_id).
 *
 * Operam sobre `resultadosFixtures` (array mutável). Ordenação por data de conclusão
 * descendente (mais recentes primeiro).
 */
const BASE = "*/api/resultados";

export const resultadosHandlers = [
  // GET /api/resultados -> lista paginada + filtrada
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();

    let rows = [...resultadosFixtures].sort((a, b) => b.concludedAt.localeCompare(a.concludedAt));

    if (search) {
      rows = rows.filter(
        (r) =>
          r.resultText.toLowerCase().includes(search) ||
          r.analysisId.toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<ResultadoDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/resultados -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<ResultadoDto>;
    const created: ResultadoDto = {
      id: `res-${Date.now()}`,
      analysisId: payload.analysisId ?? "",
      resultText: payload.resultText ?? "",
      concludedAt: payload.concludedAt ?? new Date().toISOString(),
    };
    resultadosFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/resultados/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = resultadosFixtures.findIndex((r) => r.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Resultado não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<ResultadoDto>;
    const updated: ResultadoDto = {
      ...resultadosFixtures[index],
      ...payload,
      id: resultadosFixtures[index].id,
    };
    resultadosFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/resultados/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = resultadosFixtures.findIndex((r) => r.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Resultado não encontrado." }, { status: 404 });
    }
    resultadosFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default resultadosHandlers;
