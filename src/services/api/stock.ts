import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  StockItemDto,
  StockItemListParams,
  StockLocationDto,
  StockLocationListParams,
  StockMovementDto,
  StockMovementListParams,
} from "@/types/dto/stock";

/**
 * Serviço de dados do módulo Stock Integrado.
 *
 * Cobre 3 recursos relacionados sob o prefixo `/stock`: `itens`, `localizacoes`
 * e `movimentos`. Assenta nos helpers de `client.ts` e nunca conhece o axios nem
 * o MSW directamente — os hooks só falam com estas funções.
 *
 * Rotas declaradas localmente (ver nota em `financeiro.ts` — `endpoints.ts` pode
 * estar a ser editado em paralelo). Consolidar em `endpoints.ts` (entrada
 * `stock`) no final.
 */
const ROUTES = {
  itens: "/stock/itens",
  item: (id: string) => `/stock/itens/${id}`,
  localizacoes: "/stock/localizacoes",
  localizacao: (id: string) => `/stock/localizacoes/${id}`,
  movimentos: "/stock/movimentos",
  movimento: (id: string) => `/stock/movimentos/${id}`,
};

// --- Itens ------------------------------------------------------------------

function itemsToQuery(params: StockItemListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.category) query.category = params.category;
  if (params.locationId) query.location_id = params.locationId;
  return query;
}

export function listStockItems(params: StockItemListParams): Promise<Paginated<StockItemDto>> {
  return apiGet<Paginated<StockItemDto>>(ROUTES.itens, { params: itemsToQuery(params) });
}

export function createStockItem(payload: Partial<StockItemDto>): Promise<StockItemDto> {
  return apiPost<StockItemDto>(ROUTES.itens, payload);
}

export function updateStockItem(id: string, payload: Partial<StockItemDto>): Promise<StockItemDto> {
  return apiPut<StockItemDto>(ROUTES.item(id), payload);
}

export function deleteStockItem(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.item(id));
}

// --- Localizações -----------------------------------------------------------

function locationsToQuery(params: StockLocationListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.isActive !== undefined) query.is_active = params.isActive;
  return query;
}

export function listStockLocations(params: StockLocationListParams): Promise<Paginated<StockLocationDto>> {
  return apiGet<Paginated<StockLocationDto>>(ROUTES.localizacoes, { params: locationsToQuery(params) });
}

export function createStockLocation(payload: Partial<StockLocationDto>): Promise<StockLocationDto> {
  return apiPost<StockLocationDto>(ROUTES.localizacoes, payload);
}

export function updateStockLocation(id: string, payload: Partial<StockLocationDto>): Promise<StockLocationDto> {
  return apiPut<StockLocationDto>(ROUTES.localizacao(id), payload);
}

export function deleteStockLocation(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.localizacao(id));
}

// --- Movimentos -------------------------------------------------------------

function movementsToQuery(params: StockMovementListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.type) query.type = params.type;
  if (params.itemId) query.item_id = params.itemId;
  return query;
}

export function listStockMovements(params: StockMovementListParams): Promise<Paginated<StockMovementDto>> {
  return apiGet<Paginated<StockMovementDto>>(ROUTES.movimentos, { params: movementsToQuery(params) });
}

/**
 * Cria um movimento. A actualização da quantidade do item afectado é
 * responsabilidade do SERVIDOR (regra de negócio no handler mock / futuro
 * Laravel), não do cliente — ver `handlers/stock.ts`.
 */
export function createStockMovement(payload: Partial<StockMovementDto>): Promise<StockMovementDto> {
  return apiPost<StockMovementDto>(ROUTES.movimentos, payload);
}

export function deleteStockMovement(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.movimento(id));
}
