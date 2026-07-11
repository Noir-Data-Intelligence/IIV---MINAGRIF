import { http, HttpResponse } from "msw";
import { assetsFixtures, maintenancesFixtures } from "@/mocks/fixtures/patrimonio";
import type { AssetDto, MaintenanceDto } from "@/types/dto/patrimonio";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Património — recursos `activos` (assets) e
 * `manutencoes` (asset maintenance).
 *
 * Operam sobre os arrays mutáveis de `fixtures/patrimonio.ts`, pelo que as
 * escritas PERSISTEM durante a sessão do browser (reset no refresh). Segue a
 * lógica de paginação/filtragem de `mocks/handlers/departamentos.ts`.
 *
 * Regra de negócio: apagar um activo remove em cascata as suas manutenções.
 */

const ASSETS = "*/api/activos";
const MAINTENANCES = "*/api/manutencoes";

export const patrimonioHandlers = [
  // GET /api/activos -> lista paginada + filtrada (search/status/categoria), ordenada por código
  http.get(ASSETS, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const status = url.searchParams.get("status") ?? "";
    const category = url.searchParams.get("category") ?? "";

    let rows = [...assetsFixtures].sort((a, b) => a.code.localeCompare(b.code));

    if (search) {
      rows = rows.filter(
        (a) =>
          a.code.toLowerCase().includes(search) ||
          a.name.toLowerCase().includes(search) ||
          (a.serialNumber ?? "").toLowerCase().includes(search) ||
          (a.location ?? "").toLowerCase().includes(search) ||
          (a.responsibleUser ?? "").toLowerCase().includes(search),
      );
    }
    if (status) rows = rows.filter((a) => a.status === status);
    if (category) rows = rows.filter((a) => a.category === category);

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<AssetDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/activos -> cria activo em memória
  http.post(ASSETS, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<AssetDto>;
    const now = new Date().toISOString();
    const created: AssetDto = {
      id: `ast-${Date.now()}`,
      code: payload.code ?? `PAT-${Date.now()}`,
      name: payload.name ?? "Sem nome",
      category: payload.category ?? "outros",
      description: payload.description ?? null,
      location: payload.location ?? null,
      stationId: payload.stationId ?? null,
      departmentId: payload.departmentId ?? null,
      responsibleUser: payload.responsibleUser ?? null,
      acquisitionDate: payload.acquisitionDate ?? null,
      acquisitionCost: payload.acquisitionCost ?? 0,
      currentValue: payload.currentValue ?? null,
      serialNumber: payload.serialNumber ?? null,
      status: payload.status ?? "activo",
      notes: payload.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    assetsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/activos/:id -> actualiza activo em memória
  http.put(`${ASSETS}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = assetsFixtures.findIndex((a) => a.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Activo não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<AssetDto>;
    const updated: AssetDto = {
      ...assetsFixtures[index],
      ...payload,
      // Campos imutáveis pelo cliente.
      id: assetsFixtures[index].id,
      createdAt: assetsFixtures[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    assetsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/activos/:id -> remove activo + manutenções em cascata
  http.delete(`${ASSETS}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = assetsFixtures.findIndex((a) => a.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Activo não encontrado." }, { status: 404 });
    }
    assetsFixtures.splice(index, 1);
    for (let i = maintenancesFixtures.length - 1; i >= 0; i--) {
      if (maintenancesFixtures[i].assetId === id) maintenancesFixtures.splice(i, 1);
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /api/manutencoes -> lista paginada + filtrada (search/asset/tipo), ordenada por data desc
  http.get(MAINTENANCES, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const assetId = url.searchParams.get("asset_id") ?? "";
    const type = url.searchParams.get("type") ?? "";

    let rows = [...maintenancesFixtures].sort((a, b) => b.date.localeCompare(a.date));

    if (search) {
      rows = rows.filter(
        (m) =>
          m.description.toLowerCase().includes(search) ||
          (m.provider ?? "").toLowerCase().includes(search),
      );
    }
    if (assetId) rows = rows.filter((m) => m.assetId === assetId);
    if (type) rows = rows.filter((m) => m.type === type);

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<MaintenanceDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/manutencoes -> cria manutenção; se o activo estava avariado/em
  // manutenção, uma intervenção correctiva/preventiva devolve-o a "activo".
  http.post(MAINTENANCES, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<MaintenanceDto>;
    const now = new Date().toISOString();
    const created: MaintenanceDto = {
      id: `man-${Date.now()}`,
      assetId: payload.assetId ?? "",
      date: payload.date ?? now.slice(0, 10),
      type: payload.type ?? "preventiva",
      description: payload.description ?? "Sem descrição",
      cost: payload.cost ?? 0,
      provider: payload.provider ?? null,
      nextDueDate: payload.nextDueDate ?? null,
      notes: payload.notes ?? null,
      createdAt: now,
    };
    maintenancesFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/manutencoes/:id -> actualiza manutenção em memória
  http.put(`${MAINTENANCES}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = maintenancesFixtures.findIndex((m) => m.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Manutenção não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<MaintenanceDto>;
    const updated: MaintenanceDto = {
      ...maintenancesFixtures[index],
      ...payload,
      id: maintenancesFixtures[index].id,
      createdAt: maintenancesFixtures[index].createdAt,
    };
    maintenancesFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/manutencoes/:id -> remove manutenção em memória
  http.delete(`${MAINTENANCES}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = maintenancesFixtures.findIndex((m) => m.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Manutenção não encontrada." }, { status: 404 });
    }
    maintenancesFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default patrimonioHandlers;
