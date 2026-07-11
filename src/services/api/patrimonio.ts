import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  AssetDto,
  AssetListParams,
  MaintenanceDto,
  MaintenanceListParams,
} from "@/types/dto/patrimonio";

/**
 * Serviço de dados do módulo Património.
 *
 * Cobre 2 recursos relacionados: `activos` (assets, CRUD) e `manutencoes`
 * (asset maintenance, CRUD). Assenta nos helpers de `client.ts` e nunca conhece
 * o axios nem o MSW directamente.
 *
 * Rotas declaradas localmente (ver nota em `documentos.ts`) — consolidar em
 * `endpoints.ts` (entradas `activos` e `manutencoes`).
 */
const ROUTES = {
  activos: "/activos",
  activo: (id: string) => `/activos/${id}`,
  manutencoes: "/manutencoes",
  manutencao: (id: string) => `/manutencoes/${id}`,
};

/** Converte `AssetListParams` em query params REST (snake_case p/ Laravel). */
function toAssetQuery(params: AssetListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  if (params.category) query.category = params.category;
  return query;
}

/** Converte `MaintenanceListParams` em query params REST (snake_case p/ Laravel). */
function toMaintenanceQuery(
  params: MaintenanceListParams,
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.assetId) query.asset_id = params.assetId;
  if (params.type) query.type = params.type;
  return query;
}

// --- Activos ---------------------------------------------------------------

export function listAssets(params: AssetListParams): Promise<Paginated<AssetDto>> {
  return apiGet<Paginated<AssetDto>>(ROUTES.activos, { params: toAssetQuery(params) });
}

export function createAsset(payload: Partial<AssetDto>): Promise<AssetDto> {
  return apiPost<AssetDto>(ROUTES.activos, payload);
}

export function updateAsset(id: string, payload: Partial<AssetDto>): Promise<AssetDto> {
  return apiPut<AssetDto>(ROUTES.activo(id), payload);
}

export function deleteAsset(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.activo(id));
}

// --- Manutenções -----------------------------------------------------------

export function listMaintenances(
  params: MaintenanceListParams,
): Promise<Paginated<MaintenanceDto>> {
  return apiGet<Paginated<MaintenanceDto>>(ROUTES.manutencoes, {
    params: toMaintenanceQuery(params),
  });
}

export function createMaintenance(payload: Partial<MaintenanceDto>): Promise<MaintenanceDto> {
  return apiPost<MaintenanceDto>(ROUTES.manutencoes, payload);
}

export function updateMaintenance(
  id: string,
  payload: Partial<MaintenanceDto>,
): Promise<MaintenanceDto> {
  return apiPut<MaintenanceDto>(ROUTES.manutencao(id), payload);
}

export function deleteMaintenance(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.manutencao(id));
}
