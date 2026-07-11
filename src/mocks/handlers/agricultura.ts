import { http, HttpResponse } from "msw";
import {
  cropsFixtures,
  fieldsFixtures,
  harvestsFixtures,
} from "@/mocks/fixtures/agricultura";
import type { CropDto, FieldDto, HarvestDto } from "@/types/dto/agricultura";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Agricultura — recursos `culturas` (Crop), `campos`
 * (Field/talhão) e `colheitas` (Harvest).
 *
 * Operam sobre os arrays mutáveis de `fixtures/agricultura.ts`, pelo que as
 * escritas PERSISTEM durante a sessão do browser (reset no refresh). Segue a
 * lógica de paginação/filtragem de `handlers/financeiro.ts`.
 *
 * Remoções em cascata para manter a coerência do mock:
 *  - apagar uma cultura arrasta os campos que a referem e as colheitas desses
 *    campos;
 *  - apagar um campo arrasta as suas colheitas.
 */

const CULTURAS = "*/api/culturas";
const CAMPOS = "*/api/campos";
const COLHEITAS = "*/api/colheitas";

/** Remove in-place todos os elementos que satisfazem o predicado. */
function removeWhere<T>(arr: T[], pred: (item: T) => boolean) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (pred(arr[i])) arr.splice(i, 1);
  }
}

function paginate<T>(rows: T[], page: number, perPage: number): Paginated<T> {
  const total = rows.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  return {
    data: rows.slice(start, start + perPage),
    meta: { currentPage: page, perPage, total, lastPage },
  };
}

export const agriculturaHandlers = [
  // ======================= CULTURAS =======================

  // GET /api/culturas -> lista paginada + filtrada, ordenada por nome
  http.get(CULTURAS, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();

    let rows = [...cropsFixtures].sort((a, b) => a.name.localeCompare(b.name));

    if (search) {
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          (c.scientificName ?? "").toLowerCase().includes(search) ||
          (c.notes ?? "").toLowerCase().includes(search),
      );
    }

    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /api/culturas -> cria em memória
  http.post(CULTURAS, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<CropDto>;
    const created: CropDto = {
      id: `crop-${Date.now()}`,
      name: payload.name ?? "Sem nome",
      scientificName: payload.scientificName ?? null,
      cycleDays: payload.cycleDays ?? null,
      notes: payload.notes ?? null,
      createdAt: new Date().toISOString(),
    };
    cropsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/culturas/:id -> actualiza em memória
  http.put(`${CULTURAS}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = cropsFixtures.findIndex((c) => c.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Cultura não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<CropDto>;
    const updated: CropDto = {
      ...cropsFixtures[index],
      ...payload,
      cycleDays: payload.cycleDays !== undefined ? payload.cycleDays : cropsFixtures[index].cycleDays,
      id: cropsFixtures[index].id,
      createdAt: cropsFixtures[index].createdAt,
    };
    cropsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/culturas/:id -> remove cultura + campos e colheitas dependentes
  http.delete(`${CULTURAS}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = cropsFixtures.findIndex((c) => c.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Cultura não encontrada." }, { status: 404 });
    }
    const fieldIds = fieldsFixtures.filter((f) => f.cropId === id).map((f) => f.id);
    cropsFixtures.splice(index, 1);
    removeWhere(fieldsFixtures, (f) => f.cropId === id);
    removeWhere(harvestsFixtures, (h) => fieldIds.includes(h.fieldId));
    return new HttpResponse(null, { status: 204 });
  }),

  // ======================= CAMPOS =======================

  // GET /api/campos -> lista paginada + filtrada, ordenada por data de plantio (desc)
  http.get(CAMPOS, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const stationId = url.searchParams.get("station_id") ?? "";
    const cropId = url.searchParams.get("crop_id") ?? "";
    const status = url.searchParams.get("status") ?? "";

    let rows = [...fieldsFixtures].sort((a, b) =>
      (b.plantingDate ?? "").localeCompare(a.plantingDate ?? ""),
    );

    if (search) {
      rows = rows.filter(
        (f) =>
          (f.fieldCode ?? "").toLowerCase().includes(search) ||
          (f.notes ?? "").toLowerCase().includes(search),
      );
    }
    if (stationId) rows = rows.filter((f) => f.stationId === stationId);
    if (cropId) rows = rows.filter((f) => f.cropId === cropId);
    if (status) rows = rows.filter((f) => f.status === status);

    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /api/campos -> cria em memória
  http.post(CAMPOS, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<FieldDto>;
    const created: FieldDto = {
      id: `fld-${Date.now()}`,
      stationId: payload.stationId ?? "",
      cropId: payload.cropId ?? "",
      fieldCode: payload.fieldCode ?? null,
      areaHa: Number(payload.areaHa ?? 0),
      plantingDate: payload.plantingDate ?? null,
      expectedHarvest: payload.expectedHarvest ?? null,
      status: payload.status ?? "planeado",
      notes: payload.notes ?? null,
      createdAt: new Date().toISOString(),
    };
    fieldsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/campos/:id -> actualiza em memória
  http.put(`${CAMPOS}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = fieldsFixtures.findIndex((f) => f.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Campo não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<FieldDto>;
    const updated: FieldDto = {
      ...fieldsFixtures[index],
      ...payload,
      areaHa: payload.areaHa !== undefined ? Number(payload.areaHa) : fieldsFixtures[index].areaHa,
      id: fieldsFixtures[index].id,
      createdAt: fieldsFixtures[index].createdAt,
    };
    fieldsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/campos/:id -> remove campo + colheitas dependentes
  http.delete(`${CAMPOS}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = fieldsFixtures.findIndex((f) => f.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Campo não encontrado." }, { status: 404 });
    }
    fieldsFixtures.splice(index, 1);
    removeWhere(harvestsFixtures, (h) => h.fieldId === id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ======================= COLHEITAS =======================

  // GET /api/colheitas -> lista paginada + filtrada, ordenada por data (desc)
  http.get(COLHEITAS, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const fieldId = url.searchParams.get("field_id") ?? "";

    let rows = [...harvestsFixtures].sort((a, b) => b.harvestDate.localeCompare(a.harvestDate));

    if (search) {
      rows = rows.filter(
        (h) =>
          (h.qualityGrade ?? "").toLowerCase().includes(search) ||
          (h.notes ?? "").toLowerCase().includes(search) ||
          h.unit.toLowerCase().includes(search),
      );
    }
    if (fieldId) rows = rows.filter((h) => h.fieldId === fieldId);

    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /api/colheitas -> cria em memória
  http.post(COLHEITAS, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<HarvestDto>;
    const created: HarvestDto = {
      id: `hrv-${Date.now()}`,
      fieldId: payload.fieldId ?? "",
      harvestDate: payload.harvestDate ?? new Date().toISOString().slice(0, 10),
      quantity: Number(payload.quantity ?? 0),
      unit: payload.unit ?? "kg",
      qualityGrade: payload.qualityGrade ?? null,
      notes: payload.notes ?? null,
      createdAt: new Date().toISOString(),
    };
    harvestsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/colheitas/:id -> actualiza em memória
  http.put(`${COLHEITAS}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = harvestsFixtures.findIndex((h) => h.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Colheita não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<HarvestDto>;
    const updated: HarvestDto = {
      ...harvestsFixtures[index],
      ...payload,
      quantity: payload.quantity !== undefined ? Number(payload.quantity) : harvestsFixtures[index].quantity,
      id: harvestsFixtures[index].id,
      createdAt: harvestsFixtures[index].createdAt,
    };
    harvestsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/colheitas/:id -> remove em memória
  http.delete(`${COLHEITAS}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = harvestsFixtures.findIndex((h) => h.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Colheita não encontrada." }, { status: 404 });
    }
    harvestsFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default agriculturaHandlers;
