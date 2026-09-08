import { http, HttpResponse } from "msw";
import { assetsCentralFixtures, maintenancesCentralFixtures } from "@/mocks/fixtures/patrimonioCentral";
import { usersFixtures } from "@/mocks/fixtures/users";
import type { AssetCentralDto, MaintenanceCentralDto } from "@/types/dto/patrimonioCentral";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do Património Central — recursos `patrimonio-central` (assets)
 * e `patrimonio-central/manutencoes`. Esquema separado de
 * `handlers/patrimonioEstacao.ts` (dualidade obrigatória, ver
 * SIG-IIV-MEMORIA-PROJETO.md secção 6) — replica fielmente o backend Laravel
 * real (`/patrimonio-central`), não o antigo `/activos` unificado.
 *
 * Regra de negócio: apagar um activo remove em cascata as suas manutenções.
 */

const ASSETS = "*/api/patrimonio-central";
const MAINTENANCES = "*/api/patrimonio-central/manutencoes";

export const patrimonioCentralHandlers = [
  http.get(ASSETS, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const status = url.searchParams.get("status") ?? "";
    const category = url.searchParams.get("category") ?? "";

    let rows = [...assetsCentralFixtures].sort((a, b) => a.code.localeCompare(b.code));

    if (search) {
      rows = rows.filter(
        (a) =>
          a.code.toLowerCase().includes(search) ||
          a.name.toLowerCase().includes(search) ||
          (a.serialNumber ?? "").toLowerCase().includes(search) ||
          (a.location ?? "").toLowerCase().includes(search) ||
          (usersFixtures.find((u) => u.id === a.responsibleUserId)?.fullName ?? "")
            .toLowerCase()
            .includes(search),
      );
    }
    if (status) rows = rows.filter((a) => a.status === status);
    if (category) rows = rows.filter((a) => a.category === category);

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<AssetCentralDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  http.post(ASSETS, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<AssetCentralDto>;
    const now = new Date().toISOString();
    const created: AssetCentralDto = {
      id: `ast-c-${Date.now()}`,
      code: payload.code ?? `PAT-C-${Date.now()}`,
      name: payload.name ?? "Sem nome",
      category: payload.category ?? "outros",
      description: payload.description ?? null,
      location: payload.location ?? null,
      departmentId: payload.departmentId ?? null,
      responsibleUserId: payload.responsibleUserId ?? null,
      acquisitionDate: payload.acquisitionDate ?? null,
      acquisitionCost: payload.acquisitionCost ?? 0,
      currentValue: payload.currentValue ?? null,
      serialNumber: payload.serialNumber ?? null,
      status: payload.status ?? "activo",
      notes: payload.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    assetsCentralFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(`${ASSETS}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = assetsCentralFixtures.findIndex((a) => a.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Activo não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<AssetCentralDto>;
    const updated: AssetCentralDto = {
      ...assetsCentralFixtures[index],
      ...payload,
      id: assetsCentralFixtures[index].id,
      createdAt: assetsCentralFixtures[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    assetsCentralFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(`${ASSETS}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = assetsCentralFixtures.findIndex((a) => a.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Activo não encontrado." }, { status: 404 });
    }
    assetsCentralFixtures.splice(index, 1);
    for (let i = maintenancesCentralFixtures.length - 1; i >= 0; i--) {
      if (maintenancesCentralFixtures[i].assetId === id) maintenancesCentralFixtures.splice(i, 1);
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(MAINTENANCES, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const assetId = url.searchParams.get("asset_id") ?? "";
    const type = url.searchParams.get("type") ?? "";

    let rows = [...maintenancesCentralFixtures].sort((a, b) => b.date.localeCompare(a.date));

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

    const body: Paginated<MaintenanceCentralDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  http.post(MAINTENANCES, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<MaintenanceCentralDto>;
    const now = new Date().toISOString();
    const created: MaintenanceCentralDto = {
      id: `man-c-${Date.now()}`,
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
    maintenancesCentralFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(`${MAINTENANCES}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = maintenancesCentralFixtures.findIndex((m) => m.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Manutenção não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<MaintenanceCentralDto>;
    const updated: MaintenanceCentralDto = {
      ...maintenancesCentralFixtures[index],
      ...payload,
      id: maintenancesCentralFixtures[index].id,
      createdAt: maintenancesCentralFixtures[index].createdAt,
    };
    maintenancesCentralFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(`${MAINTENANCES}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = maintenancesCentralFixtures.findIndex((m) => m.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Manutenção não encontrada." }, { status: 404 });
    }
    maintenancesCentralFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default patrimonioCentralHandlers;
