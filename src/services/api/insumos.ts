import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type { InsumoDto, InsumoListParams } from "@/types/dto/insumo";

/**
 * Serviço de dados do módulo Insumos (depende de `laboratorios` via laboratoryId).
 *
 * Rotas declaradas localmente (ver nota em `laboratorios.ts`) — consolidar em
 * `endpoints.ts` (entrada `insumos`).
 */
const ROUTES = {
  list: "/insumos",
  detail: (id: string) => `/insumos/${id}`,
};

/** Converte `InsumoListParams` em query params REST (snake_case p/ Laravel). */
function toQuery(params: InsumoListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.laboratoryId) query.laboratory_id = params.laboratoryId;
  return query;
}

export function listInsumos(params: InsumoListParams): Promise<Paginated<InsumoDto>> {
  return apiGet<Paginated<InsumoDto>>(ROUTES.list, { params: toQuery(params) });
}

export function getInsumo(id: string): Promise<InsumoDto> {
  return apiGet<InsumoDto>(ROUTES.detail(id));
}

export function createInsumo(payload: Partial<InsumoDto>): Promise<InsumoDto> {
  return apiPost<InsumoDto>(ROUTES.list, payload);
}

export function updateInsumo(id: string, payload: Partial<InsumoDto>): Promise<InsumoDto> {
  return apiPut<InsumoDto>(ROUTES.detail(id), payload);
}

export function deleteInsumo(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(id));
}
