import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  AssetCentralDto,
  AssetCentralListParams,
  MaintenanceCentralDto,
  MaintenanceCentralListParams,
} from "@/types/dto/patrimonioCentral";

/** Serviço de dados do Património Central — `/patrimonio-central` + `/patrimonio-central/manutencoes`. */
const ROUTES = {
  activos: "/patrimonio-central",
  activo: (id: string) => `/patrimonio-central/${id}`,
  manutencoes: "/patrimonio-central/manutencoes",
  manutencao: (id: string) => `/patrimonio-central/manutencoes/${id}`,
};

function toAssetQuery(params: AssetCentralListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  if (params.category) query.category = params.category;
  return query;
}

function toMaintenanceQuery(params: MaintenanceCentralListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.assetId) query.asset_id = params.assetId;
  if (params.type) query.type = params.type;
  return query;
}

export function listAssetsCentral(params: AssetCentralListParams): Promise<Paginated<AssetCentralDto>> {
  return apiGet<Paginated<AssetCentralDto>>(ROUTES.activos, { params: toAssetQuery(params) });
}

export function createAssetCentral(payload: Partial<AssetCentralDto>): Promise<AssetCentralDto> {
  return apiPost<AssetCentralDto>(ROUTES.activos, payload);
}

export function updateAssetCentral(id: string, payload: Partial<AssetCentralDto>): Promise<AssetCentralDto> {
  return apiPut<AssetCentralDto>(ROUTES.activo(id), payload);
}

export function deleteAssetCentral(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.activo(id));
}

export function listMaintenancesCentral(
  params: MaintenanceCentralListParams,
): Promise<Paginated<MaintenanceCentralDto>> {
  return apiGet<Paginated<MaintenanceCentralDto>>(ROUTES.manutencoes, { params: toMaintenanceQuery(params) });
}

export function createMaintenanceCentral(payload: Partial<MaintenanceCentralDto>): Promise<MaintenanceCentralDto> {
  return apiPost<MaintenanceCentralDto>(ROUTES.manutencoes, payload);
}

export function updateMaintenanceCentral(
  id: string,
  payload: Partial<MaintenanceCentralDto>,
): Promise<MaintenanceCentralDto> {
  return apiPut<MaintenanceCentralDto>(ROUTES.manutencao(id), payload);
}

export function deleteMaintenanceCentral(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.manutencao(id));
}
