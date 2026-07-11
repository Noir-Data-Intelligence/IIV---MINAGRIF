import { http, HttpResponse } from "msw";
import {
  stockItemsFixtures,
  stockLocationsFixtures,
  stockMovementsFixtures,
} from "@/mocks/fixtures/stock";
import type {
  MovementType,
  StockItemDto,
  StockLocationDto,
  StockMovementDto,
} from "@/types/dto/stock";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Stock Integrado — recursos `itens`, `localizacoes` e
 * `movimentos`, todos sob o prefixo `/stock`.
 *
 * Operam sobre os arrays mutáveis de `fixtures/stock.ts`, pelo que as escritas
 * PERSISTEM durante a sessão do browser (reset no refresh). Seguem a lógica de
 * paginação/filtragem de `handlers/financeiro.ts`.
 *
 * Regra de negócio no SERVIDOR: registar um movimento actualiza a quantidade do
 * item afectado (`applyMovementDelta`) — nunca no cliente. Apagar um movimento
 * reverte esse efeito. Remover um item arrasta os seus movimentos; remover uma
 * localização limpa (null) as referências em itens e movimentos.
 */

const ITENS = "*/api/stock/itens";
const LOCALIZACOES = "*/api/stock/localizacoes";
const MOVIMENTOS = "*/api/stock/movimentos";

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

/**
 * Variação da quantidade de um item provocada por um movimento:
 *  - `entrada` / `ajuste` -> soma (`+quantity`);
 *  - `saida`              -> subtrai (`-quantity`);
 *  - `transferencia`      -> 0 (só muda de localização; o total em mão mantém-se).
 */
function movementDelta(type: MovementType, quantity: number): number {
  if (type === "entrada" || type === "ajuste") return quantity;
  if (type === "saida") return -quantity;
  return 0; // transferencia
}

/** Aplica `delta` à quantidade do item (nunca abaixo de zero). */
function applyItemQuantity(itemId: string, delta: number) {
  if (delta === 0) return;
  const index = stockItemsFixtures.findIndex((i) => i.id === itemId);
  if (index === -1) return;
  const next = Math.max(0, Number(stockItemsFixtures[index].quantity) + delta);
  stockItemsFixtures[index] = { ...stockItemsFixtures[index], quantity: next };
}

export const stockHandlers = [
  // ======================= ITENS =======================

  // GET /api/stock/itens -> lista paginada + filtrada, ordenada por nome
  http.get(ITENS, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const category = url.searchParams.get("category") ?? "";
    const locationId = url.searchParams.get("location_id") ?? "";

    let rows = [...stockItemsFixtures].sort((a, b) => a.name.localeCompare(b.name));

    if (search) {
      rows = rows.filter(
        (i) =>
          i.name.toLowerCase().includes(search) ||
          (i.sku ?? "").toLowerCase().includes(search) ||
          (i.supplier ?? "").toLowerCase().includes(search),
      );
    }
    if (category) rows = rows.filter((i) => i.category === category);
    if (locationId) rows = rows.filter((i) => i.locationId === locationId);

    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /api/stock/itens -> cria em memória
  http.post(ITENS, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<StockItemDto>;
    const created: StockItemDto = {
      id: `itm-${Date.now()}`,
      name: payload.name ?? "Sem nome",
      category: payload.category ?? "laboratorio",
      sku: payload.sku ?? null,
      unit: payload.unit ?? "unidade",
      quantity: Number(payload.quantity ?? 0),
      minStock: Number(payload.minStock ?? 0),
      locationId: payload.locationId ?? null,
      expiryDate: payload.expiryDate ?? null,
      supplier: payload.supplier ?? null,
      unitCost: payload.unitCost != null ? Number(payload.unitCost) : null,
      notes: payload.notes ?? null,
      createdAt: new Date().toISOString(),
    };
    stockItemsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/stock/itens/:id -> actualiza em memória
  http.put(`${ITENS}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = stockItemsFixtures.findIndex((i) => i.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Item não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<StockItemDto>;
    const current = stockItemsFixtures[index];
    const updated: StockItemDto = {
      ...current,
      ...payload,
      quantity: payload.quantity !== undefined ? Number(payload.quantity) : current.quantity,
      minStock: payload.minStock !== undefined ? Number(payload.minStock) : current.minStock,
      unitCost:
        payload.unitCost !== undefined
          ? payload.unitCost != null
            ? Number(payload.unitCost)
            : null
          : current.unitCost,
      id: current.id,
      createdAt: current.createdAt,
    };
    stockItemsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/stock/itens/:id -> remove item + os seus movimentos
  http.delete(`${ITENS}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = stockItemsFixtures.findIndex((i) => i.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Item não encontrado." }, { status: 404 });
    }
    stockItemsFixtures.splice(index, 1);
    removeWhere(stockMovementsFixtures, (m) => m.itemId === id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ======================= LOCALIZAÇÕES =======================

  // GET /api/stock/localizacoes -> lista paginada + filtrada, ordenada por nome
  http.get(LOCALIZACOES, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const isActive = url.searchParams.get("is_active");

    let rows = [...stockLocationsFixtures].sort((a, b) => a.name.localeCompare(b.name));

    if (search) {
      rows = rows.filter(
        (l) =>
          l.name.toLowerCase().includes(search) ||
          (l.description ?? "").toLowerCase().includes(search),
      );
    }
    if (isActive !== null) rows = rows.filter((l) => l.isActive === (isActive === "true"));

    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /api/stock/localizacoes -> cria em memória
  http.post(LOCALIZACOES, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<StockLocationDto>;
    const created: StockLocationDto = {
      id: `loc-${Date.now()}`,
      name: payload.name ?? "Sem nome",
      description: payload.description ?? null,
      isActive: payload.isActive ?? true,
      createdAt: new Date().toISOString(),
    };
    stockLocationsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/stock/localizacoes/:id -> actualiza em memória
  http.put(`${LOCALIZACOES}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = stockLocationsFixtures.findIndex((l) => l.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Localização não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<StockLocationDto>;
    const updated: StockLocationDto = {
      ...stockLocationsFixtures[index],
      ...payload,
      id: stockLocationsFixtures[index].id,
      createdAt: stockLocationsFixtures[index].createdAt,
    };
    stockLocationsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/stock/localizacoes/:id -> remove + limpa (null) as referências
  http.delete(`${LOCALIZACOES}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = stockLocationsFixtures.findIndex((l) => l.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Localização não encontrada." }, { status: 404 });
    }
    stockLocationsFixtures.splice(index, 1);
    // Itens e movimentos que referem a localização passam a ter a FK a null.
    for (let i = 0; i < stockItemsFixtures.length; i++) {
      if (stockItemsFixtures[i].locationId === id) {
        stockItemsFixtures[i] = { ...stockItemsFixtures[i], locationId: null };
      }
    }
    for (let i = 0; i < stockMovementsFixtures.length; i++) {
      const m = stockMovementsFixtures[i];
      if (m.fromLocationId === id || m.toLocationId === id) {
        stockMovementsFixtures[i] = {
          ...m,
          fromLocationId: m.fromLocationId === id ? null : m.fromLocationId,
          toLocationId: m.toLocationId === id ? null : m.toLocationId,
        };
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // ======================= MOVIMENTOS =======================

  // GET /api/stock/movimentos -> lista paginada + filtrada, ordenada por data (desc)
  http.get(MOVIMENTOS, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const type = url.searchParams.get("type") ?? "";
    const itemId = url.searchParams.get("item_id") ?? "";

    let rows = [...stockMovementsFixtures].sort((a, b) => {
      const byDate = b.movementDate.localeCompare(a.movementDate);
      return byDate !== 0 ? byDate : b.createdAt.localeCompare(a.createdAt);
    });

    if (search) rows = rows.filter((m) => (m.reason ?? "").toLowerCase().includes(search));
    if (type) rows = rows.filter((m) => m.type === type);
    if (itemId) rows = rows.filter((m) => m.itemId === itemId);

    return HttpResponse.json(paginate(rows, page, perPage));
  }),

  // POST /api/stock/movimentos -> cria movimento E actualiza a quantidade do item
  http.post(MOVIMENTOS, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<StockMovementDto>;
    const type = (payload.type ?? "entrada") as MovementType;
    const quantity = Number(payload.quantity ?? 0);
    const itemId = payload.itemId ?? "";

    if (!stockItemsFixtures.some((i) => i.id === itemId)) {
      return HttpResponse.json({ message: "Item não encontrado." }, { status: 404 });
    }

    const created: StockMovementDto = {
      id: `mov-${Date.now()}`,
      itemId,
      type,
      quantity,
      fromLocationId: payload.fromLocationId ?? null,
      toLocationId: payload.toLocationId ?? null,
      reason: payload.reason ?? null,
      performedBy: payload.performedBy ?? null,
      movementDate: payload.movementDate ?? new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    stockMovementsFixtures.unshift(created);

    // Regra de negócio no servidor: ajustar a quantidade do item.
    applyItemQuantity(itemId, movementDelta(type, quantity));

    return HttpResponse.json(created, { status: 201 });
  }),

  // DELETE /api/stock/movimentos/:id -> remove E reverte o efeito na quantidade
  http.delete(`${MOVIMENTOS}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = stockMovementsFixtures.findIndex((m) => m.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Movimento não encontrado." }, { status: 404 });
    }
    const [removed] = stockMovementsFixtures.splice(index, 1);
    // Reverte o delta aplicado na criação.
    applyItemQuantity(removed.itemId, -movementDelta(removed.type, removed.quantity));
    return new HttpResponse(null, { status: 204 });
  }),
];

export default stockHandlers;
