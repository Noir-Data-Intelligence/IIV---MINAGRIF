import { http, HttpResponse } from "msw";
import { trainingsFixtures } from "@/mocks/fixtures/formacoes";
import type { TrainingDto } from "@/types/dto/formacoes";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Formações — recurso `formacoes`.
 *
 * Operam sobre `trainingsFixtures` (array mutável em memória), pelo que as
 * escritas PERSISTEM durante a sessão do browser (reset no refresh). Segue a
 * lógica de paginação/filtragem de `handlers/departamentos.ts`.
 */

const BASE = "*/api/formacoes";

function paginate<T>(rows: T[], page: number, perPage: number): Paginated<T> {
  const total = rows.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  return {
    data: rows.slice(start, start + perPage),
    meta: { currentPage: page, perPage, total, lastPage },
  };
}

export const formacoesHandlers = [
  // GET /api/formacoes -> lista paginada + filtrada, ordenada por início (desc)
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const status = url.searchParams.get("status") ?? "";

    let rows = [...trainingsFixtures].sort((a, b) => b.startDate.localeCompare(a.startDate));

    if (search) {
      rows = rows.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          (t.trainer ?? "").toLowerCase().includes(search) ||
          (t.location ?? "").toLowerCase().includes(search) ||
          (t.description ?? "").toLowerCase().includes(search),
      );
    }
    if (status) rows = rows.filter((t) => t.status === status);

    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /api/formacoes -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<TrainingDto>;
    const startDate = payload.startDate ?? new Date().toISOString().slice(0, 10);
    const created: TrainingDto = {
      id: `for-${Date.now()}`,
      title: payload.title ?? "Sem título",
      description: payload.description ?? null,
      trainer: payload.trainer ?? null,
      location: payload.location ?? null,
      startDate,
      endDate: payload.endDate ?? startDate,
      hours: Number(payload.hours ?? 0),
      status: payload.status ?? "planeada",
      notes: payload.notes ?? null,
      createdAt: new Date().toISOString(),
    };
    trainingsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/formacoes/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = trainingsFixtures.findIndex((t) => t.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Formação não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<TrainingDto>;
    const updated: TrainingDto = {
      ...trainingsFixtures[index],
      ...payload,
      hours: payload.hours !== undefined ? Number(payload.hours) : trainingsFixtures[index].hours,
      id: trainingsFixtures[index].id,
      createdAt: trainingsFixtures[index].createdAt,
    };
    trainingsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/formacoes/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = trainingsFixtures.findIndex((t) => t.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Formação não encontrada." }, { status: 404 });
    }
    trainingsFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default formacoesHandlers;
