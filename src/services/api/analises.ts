import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type { AnaliseDto, AnaliseListParams } from "@/types/dto/analise";

/**
 * Serviço de dados do módulo Análises (depende de `laboratorios` via laboratoryId).
 *
 * Rotas declaradas localmente (ver nota em `laboratorios.ts`) — consolidar em
 * `endpoints.ts` (entrada `analises`).
 */
const ROUTES = {
  list: "/analises",
  detail: (id: string) => `/analises/${id}`,
};

/** Converte `AnaliseListParams` em query params REST (snake_case p/ Laravel). */
function toQuery(params: AnaliseListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.laboratoryId) query.laboratory_id = params.laboratoryId;
  if (params.status) query.status = params.status;
  return query;
}

export function listAnalises(params: AnaliseListParams): Promise<Paginated<AnaliseDto>> {
  return apiGet<Paginated<AnaliseDto>>(ROUTES.list, { params: toQuery(params) });
}

export function getAnalise(id: string): Promise<AnaliseDto> {
  return apiGet<AnaliseDto>(ROUTES.detail(id));
}

export function createAnalise(payload: Partial<AnaliseDto>): Promise<AnaliseDto> {
  return apiPost<AnaliseDto>(ROUTES.list, payload);
}

export function updateAnalise(id: string, payload: Partial<AnaliseDto>): Promise<AnaliseDto> {
  return apiPut<AnaliseDto>(ROUTES.detail(id), payload);
}

export function deleteAnalise(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(id));
}
