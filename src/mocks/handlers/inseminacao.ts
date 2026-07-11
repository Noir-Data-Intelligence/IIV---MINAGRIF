import { http, HttpResponse } from "msw";
import {
  breedersFixtures,
  iaCentersFixtures,
  inseminationRecordsFixtures,
  nitrogenTanksFixtures,
  semenDosesFixtures,
} from "@/mocks/fixtures/inseminacao";
import type {
  BreederDto,
  DoseDto,
  IACenterDto,
  InsemDto,
  TankDto,
} from "@/types/dto/inseminacao";

/**
 * Handlers MSW do módulo Inseminação Artificial (5 sub-recursos).
 *
 * Cada entidade expõe GET (lista simples, não paginada), POST, PUT/:id e
 * DELETE/:id sobre o respectivo array mutável em memória. A fábrica `crudHandlers`
 * remove a repetição; cada entidade fornece o seu construtor de criação para
 * garantir os defaults/tipos correctos. Wildcard `*` para casar qualquer baseURL.
 *
 * NOTA: os getters (`() => arr`) usam o live-binding do módulo de fixtures, e as
 * escritas mutam os arrays em memória (unshift/splice), persistindo na sessão.
 */
const BASE = "*/api/inseminacao";

interface Entity {
  id: string;
  createdAt: string;
}

function crudHandlers<T extends Entity>(
  path: string,
  getArr: () => T[],
  build: (payload: Partial<T>, id: string, now: string) => T,
  sortFn?: (a: T, b: T) => number,
  notFoundMessage = "Registo não encontrado.",
) {
  const url = `${BASE}/${path}`;
  return [
    http.get(url, () => {
      const rows = [...getArr()];
      if (sortFn) rows.sort(sortFn);
      return HttpResponse.json(rows);
    }),

    http.post(url, async ({ request }) => {
      const payload = (await request.json().catch(() => ({}))) as Partial<T>;
      const created = build(payload, `${path.slice(0, 3)}-${Date.now()}`, new Date().toISOString());
      getArr().unshift(created);
      return HttpResponse.json(created, { status: 201 });
    }),

    http.put(`${url}/:id`, async ({ params, request }) => {
      const { id } = params as { id: string };
      const arr = getArr();
      const index = arr.findIndex((r) => r.id === id);
      if (index === -1) return HttpResponse.json({ message: notFoundMessage }, { status: 404 });
      const payload = (await request.json().catch(() => ({}))) as Partial<T>;
      const updated = { ...arr[index], ...payload, id: arr[index].id, createdAt: arr[index].createdAt };
      arr[index] = updated;
      return HttpResponse.json(updated);
    }),

    http.delete(`${url}/:id`, ({ params }) => {
      const { id } = params as { id: string };
      const arr = getArr();
      const index = arr.findIndex((r) => r.id === id);
      if (index === -1) return HttpResponse.json({ message: notFoundMessage }, { status: 404 });
      arr.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

export const inseminacaoHandlers = [
  ...crudHandlers<IACenterDto>(
    "centros",
    () => iaCentersFixtures,
    (p, id, now) => ({
      id,
      name: p.name ?? "Sem nome",
      location: p.location ?? null,
      responsibleUserId: p.responsibleUserId ?? null,
      notes: p.notes ?? null,
      isActive: p.isActive ?? true,
      createdAt: now,
    }),
    (a, b) => a.name.localeCompare(b.name),
  ),

  ...crudHandlers<BreederDto>(
    "reprodutores",
    () => breedersFixtures,
    (p, id, now) => ({
      id,
      centerId: p.centerId ?? "",
      tag: p.tag ?? "SEM-TAG",
      name: p.name ?? null,
      species: p.species ?? "",
      breed: p.breed ?? null,
      birthDate: p.birthDate ?? null,
      status: p.status ?? "activo",
      notes: p.notes ?? null,
      createdAt: now,
    }),
    (a, b) => a.tag.localeCompare(b.tag),
  ),

  ...crudHandlers<TankDto>(
    "tanques",
    () => nitrogenTanksFixtures,
    (p, id, now) => ({
      id,
      centerId: p.centerId ?? "",
      code: p.code ?? "SEM-COD",
      capacityL: p.capacityL ?? 0,
      currentLevelL: p.currentLevelL ?? 0,
      minLevelL: p.minLevelL ?? 0,
      lastRefillDate: p.lastRefillDate ?? null,
      notes: p.notes ?? null,
      createdAt: now,
    }),
    (a, b) => a.code.localeCompare(b.code),
  ),

  ...crudHandlers<DoseDto>(
    "doses",
    () => semenDosesFixtures,
    (p, id, now) => ({
      id,
      breederId: p.breederId ?? "",
      tankId: p.tankId ?? null,
      collectionDate: p.collectionDate ?? now.slice(0, 10),
      quantity: p.quantity ?? 0,
      availableQuantity: p.availableQuantity ?? p.quantity ?? 0,
      qualityGrade: p.qualityGrade ?? "A",
      notes: p.notes ?? null,
      createdAt: now,
    }),
    (a, b) => b.collectionDate.localeCompare(a.collectionDate),
  ),

  ...crudHandlers<InsemDto>(
    "registos",
    () => inseminationRecordsFixtures,
    (p, id, now) => ({
      id,
      animalId: p.animalId ?? "",
      doseId: p.doseId ?? null,
      technicianId: p.technicianId ?? null,
      inseminationDate: p.inseminationDate ?? now.slice(0, 10),
      result: p.result ?? "pendente",
      pregnancyConfirmedAt: p.pregnancyConfirmedAt ?? null,
      expectedBirthDate: p.expectedBirthDate ?? null,
      notes: p.notes ?? null,
      createdAt: now,
    }),
    (a, b) => b.inseminationDate.localeCompare(a.inseminationDate),
  ),
];

export default inseminacaoHandlers;
