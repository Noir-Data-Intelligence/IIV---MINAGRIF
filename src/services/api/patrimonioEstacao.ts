import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  AssetEstacaoDto,
  AssetEstacaoListParams,
  MaintenanceEstacaoDto,
  MaintenanceEstacaoListParams,
} from "@/types/dto/patrimonioEstacao";

/** Serviço de dados do Património de Estação — `/patrimonio-estacao` + `/patrimonio-estacao/manutencoes`. */
const ROUTES = {
  activos: "/patrimonio-estacao",
  activo: (id: string) => `/patrimonio-estacao/${id}`,
  manutencoes: "/patrimonio-estacao/manutencoes",
  manutencao: (id: string) => `/patrimonio-estacao/manutencoes/${id}`,
};

function toAssetQuery(params: AssetEstacaoListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  if (params.category) query.category = params.category;
  return query;
}

function toMaintenanceQuery(params: MaintenanceEstacaoListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.assetId) query.asset_id = params.assetId;
  if (params.type) query.type = params.type;
  return query;
}

export function listAssetsEstacao(params: AssetEstacaoListParams): Promise<Paginated<AssetEstacaoDto>> {
  return apiGet<Paginated<AssetEstacaoDto>>(ROUTES.activos, { params: toAssetQuery(params) });
}

export function createAssetEstacao(payload: Partial<AssetEstacaoDto>): Promise<AssetEstacaoDto> {
  return apiPost<AssetEstacaoDto>(ROUTES.activos, payload);
}

export function updateAssetEstacao(id: string, payload: Partial<AssetEstacaoDto>): Promise<AssetEstacaoDto> {
  return apiPut<AssetEstacaoDto>(ROUTES.activo(id), payload);
}

export function deleteAssetEstacao(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.activo(id));
}

export function listMaintenancesEstacao(
  params: MaintenanceEstacaoListParams,
): Promise<Paginated<MaintenanceEstacaoDto>> {
  return apiGet<Paginated<MaintenanceEstacaoDto>>(ROUTES.manutencoes, { params: toMaintenanceQuery(params) });
}

export function createMaintenanceEstacao(payload: Partial<MaintenanceEstacaoDto>): Promise<MaintenanceEstacaoDto> {
  return apiPost<MaintenanceEstacaoDto>(ROUTES.manutencoes, payload);
}

export function updateMaintenanceEstacao(
  id: string,
  payload: Partial<MaintenanceEstacaoDto>,
): Promise<MaintenanceEstacaoDto> {
  return apiPut<MaintenanceEstacaoDto>(ROUTES.manutencao(id), payload);
}

export function deleteMaintenanceEstacao(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.manutencao(id));
}
