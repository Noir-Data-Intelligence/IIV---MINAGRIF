import { http, HttpResponse } from "msw";
import { analisesFixtures } from "@/mocks/fixtures/analises";
import type { AnaliseDto, AnaliseStatus } from "@/types/dto/analise";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Análises (depende de laboratorios via laboratory_id).
 *
 * Operam sobre `analisesFixtures` (array mutável). Ordenação por data agendada
 * descendente (mais recentes primeiro), à semelhança da página original.
 */
const BASE = "*/api/analises";

export const analisesHandlers = [
  // GET /api/analises -> lista paginada + filtrada
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const laboratoryId = url.searchParams.get("laboratory_id") ?? "";
    const status = url.searchParams.get("status") ?? "";

    let rows = [...analisesFixtures].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));

    if (search) {
      rows = rows.filter(
        (a) =>
          a.clientName.toLowerCase().includes(search) ||
          a.analysisType.toLowerCase().includes(search) ||
          (a.animalSpecies ?? "").toLowerCase().includes(search) ||
          a.sampleType.toLowerCase().includes(search),
      );
    }
    if (laboratoryId) rows = rows.filter((a) => a.laboratoryId === laboratoryId);
    if (status) rows = rows.filter((a) => a.status === status);

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<AnaliseDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/analises -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<AnaliseDto>;
    const created: AnaliseDto = {
      id: `ana-${Date.now()}`,
      laboratoryId: payload.laboratoryId ?? "",
      clientName: payload.clientName ?? "Sem cliente",
      animalSpecies: payload.animalSpecies ?? null,
      animalId: payload.animalId ?? null,
      sampleType: payload.sampleType ?? "",
      analysisType: payload.analysisType ?? "",
      scheduledDate: payload.scheduledDate ?? new Date().toISOString().slice(0, 10),
      status: (payload.status ?? "agendada") as AnaliseStatus,
      notes: payload.notes ?? null,
      createdAt: new Date().toISOString(),
    };
    analisesFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/analises/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = analisesFixtures.findIndex((a) => a.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Análise não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<AnaliseDto>;
    const updated: AnaliseDto = {
      ...analisesFixtures[index],
      ...payload,
      id: analisesFixtures[index].id,
      createdAt: analisesFixtures[index].createdAt,
    };
    analisesFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/analises/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = analisesFixtures.findIndex((a) => a.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Análise não encontrada." }, { status: 404 });
    }
    analisesFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default analisesHandlers;
