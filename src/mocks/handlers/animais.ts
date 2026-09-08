import { http, HttpResponse } from "msw";
import {
  animaisFixtures,
  animalEventsFixtures,
  healthRecordsFixtures,
} from "@/mocks/fixtures/animais";
import type { AnimalDto, AnimalEventDto, HealthRecordDto } from "@/types/dto/animal";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Animais (+ sub-recursos eventos e saúde).
 *
 * Modelado em `mocks/handlers/departamentos.ts`. Todos operam sobre os arrays
 * mutáveis em memória. Os sub-recursos aninhados (`/animais/:id/eventos` e
 * `/animais/:id/saude`) são registados ANTES das rotas de detalhe do animal
 * para que o MSW não confunda os paths (a especificidade importa na ordem).
 */
const BASE = "*/api/animais";

export const animaisHandlers = [
  // ---- Sub-recurso: eventos (registados antes das rotas de detalhe) ----
  http.get(`${BASE}/:animalId/eventos`, ({ params }) => {
    const { animalId } = params as { animalId: string };
    const rows = animalEventsFixtures
      .filter((e) => e.animalId === animalId)
      .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
    return HttpResponse.json(rows);
  }),

  http.post(`${BASE}/:animalId/eventos`, async ({ params, request }) => {
    const { animalId } = params as { animalId: string };
    const payload = (await request.json().catch(() => ({}))) as Partial<AnimalEventDto>;
    const created: AnimalEventDto = {
      id: `aev-${Date.now()}`,
      animalId,
      eventType: payload.eventType ?? "observacao",
      eventDate: payload.eventDate ?? new Date().toISOString().slice(0, 10),
      destination: payload.destination ?? null,
      notes: payload.notes ?? null,
      createdAt: new Date().toISOString(),
    };
    animalEventsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // ---- Sub-recurso: registos sanitários ----
  http.get(`${BASE}/:animalId/saude`, ({ params }) => {
    const { animalId } = params as { animalId: string };
    const rows = healthRecordsFixtures
      .filter((h) => h.animalId === animalId)
      .sort((a, b) => b.recordDate.localeCompare(a.recordDate));
    return HttpResponse.json(rows);
  }),

  http.post(`${BASE}/:animalId/saude`, async ({ params, request }) => {
    const { animalId } = params as { animalId: string };
    const payload = (await request.json().catch(() => ({}))) as Partial<HealthRecordDto>;
    const created: HealthRecordDto = {
      id: `ahr-${Date.now()}`,
      animalId,
      recordType: payload.recordType ?? "vacina",
      productName: payload.productName ?? null,
      dosage: payload.dosage ?? null,
      diagnosis: payload.diagnosis ?? null,
      treatment: payload.treatment ?? null,
      veterinarian: payload.veterinarian ?? null,
      recordDate: payload.recordDate ?? new Date().toISOString().slice(0, 10),
      nextDueDate: payload.nextDueDate ?? null,
      createdAt: new Date().toISOString(),
    };
    healthRecordsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // ---- Recurso principal: animais ----
  // GET /api/animais -> lista paginada + filtrada (estação, estado, espécie, pesquisa)
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const stationId = url.searchParams.get("station_id") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const species = (url.searchParams.get("species") ?? "").trim().toLowerCase();

    let rows = [...animaisFixtures].sort((a, b) => a.tag.localeCompare(b.tag));

    if (stationId) rows = rows.filter((a) => a.stationId === stationId);
    if (status) rows = rows.filter((a) => a.status === status);
    if (species) rows = rows.filter((a) => a.species.toLowerCase().includes(species));
    if (search) {
      rows = rows.filter(
        (a) =>
          a.tag.toLowerCase().includes(search) ||
          (a.name ?? "").toLowerCase().includes(search) ||
          a.species.toLowerCase().includes(search) ||
          (a.breed ?? "").toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<AnimalDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/animais -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<AnimalDto>;
    const now = new Date().toISOString();
    const created: AnimalDto = {
      id: `ani-${Date.now()}`,
      stationId: payload.stationId ?? "",
      tag: payload.tag ?? "SEM-TAG",
      name: payload.name ?? null,
      species: payload.species ?? "",
      breed: payload.breed ?? null,
      sex: payload.sex ?? "femea",
      birthDate: payload.birthDate ?? null,
      motherTag: payload.motherTag ?? null,
      fatherTag: payload.fatherTag ?? null,
      status: payload.status ?? "activo",
      currentWeightKg: payload.currentWeightKg ?? null,
      notes: payload.notes ?? null,
      createdAt: now,
    };
    animaisFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/animais/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = animaisFixtures.findIndex((a) => a.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Animal não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<AnimalDto>;
    const updated: AnimalDto = {
      ...animaisFixtures[index],
      ...payload,
      id: animaisFixtures[index].id,
      createdAt: animaisFixtures[index].createdAt,
    };
    animaisFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/animais/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = animaisFixtures.findIndex((a) => a.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Animal não encontrado." }, { status: 404 });
    }
    animaisFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default animaisHandlers;
