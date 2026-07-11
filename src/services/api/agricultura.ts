import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  CropDto,
  CropListParams,
  FieldDto,
  FieldListParams,
  HarvestDto,
  HarvestListParams,
} from "@/types/dto/agricultura";

/**
 * Serviço de dados do módulo Agricultura.
 *
 * Cobre 3 recursos relacionados: `culturas` (Crop), `campos` (Field/talhão) e
 * `colheitas` (Harvest). Assenta nos helpers de `client.ts` e nunca conhece o
 * axios nem o MSW directamente — os hooks só falam com estas funções.
 *
 * Rotas declaradas localmente (ver nota em `financeiro.ts`) — consolidar em
 * `endpoints.ts` (entradas `culturas`, `campos`, `colheitas`) no final.
 */
const ROUTES = {
  culturas: "/culturas",
  cultura: (id: string) => `/culturas/${id}`,
  campos: "/campos",
  campo: (id: string) => `/campos/${id}`,
  colheitas: "/colheitas",
  colheita: (id: string) => `/colheitas/${id}`,
};

// --- Culturas --------------------------------------------------------------

function cropsToQuery(params: CropListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  return query;
}

export function listCrops(params: CropListParams): Promise<Paginated<CropDto>> {
  return apiGet<Paginated<CropDto>>(ROUTES.culturas, { params: cropsToQuery(params) });
}

export function createCrop(payload: Partial<CropDto>): Promise<CropDto> {
  return apiPost<CropDto>(ROUTES.culturas, payload);
}

export function updateCrop(id: string, payload: Partial<CropDto>): Promise<CropDto> {
  return apiPut<CropDto>(ROUTES.cultura(id), payload);
}

export function deleteCrop(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.cultura(id));
}

// --- Campos ----------------------------------------------------------------

function fieldsToQuery(params: FieldListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.stationId) query.station_id = params.stationId;
  if (params.cropId) query.crop_id = params.cropId;
  if (params.status) query.status = params.status;
  return query;
}

export function listFields(params: FieldListParams): Promise<Paginated<FieldDto>> {
  return apiGet<Paginated<FieldDto>>(ROUTES.campos, { params: fieldsToQuery(params) });
}

export function createField(payload: Partial<FieldDto>): Promise<FieldDto> {
  return apiPost<FieldDto>(ROUTES.campos, payload);
}

export function updateField(id: string, payload: Partial<FieldDto>): Promise<FieldDto> {
  return apiPut<FieldDto>(ROUTES.campo(id), payload);
}

export function deleteField(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.campo(id));
}

// --- Colheitas -------------------------------------------------------------

function harvestsToQuery(params: HarvestListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.fieldId) query.field_id = params.fieldId;
  return query;
}

export function listHarvests(params: HarvestListParams): Promise<Paginated<HarvestDto>> {
  return apiGet<Paginated<HarvestDto>>(ROUTES.colheitas, { params: harvestsToQuery(params) });
}

export function createHarvest(payload: Partial<HarvestDto>): Promise<HarvestDto> {
  return apiPost<HarvestDto>(ROUTES.colheitas, payload);
}

export function updateHarvest(id: string, payload: Partial<HarvestDto>): Promise<HarvestDto> {
  return apiPut<HarvestDto>(ROUTES.colheita(id), payload);
}

export function deleteHarvest(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.colheita(id));
}
