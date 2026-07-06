import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type { ResultadoDto, ResultadoListParams } from "@/types/dto/resultado";

/**
 * Serviço de dados do módulo Resultados (lab_results, depende de `analises` via analysisId).
 *
 * Rotas declaradas localmente (ver nota em `laboratorios.ts`) — consolidar em
 * `endpoints.ts` (entrada `resultados`).
 */
const ROUTES = {
  list: "/resultados",
  detail: (id: string) => `/resultados/${id}`,
};

/** Converte `ResultadoListParams` em query params REST (snake_case p/ Laravel). */
function toQuery(params: ResultadoListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  return query;
}

export function listResultados(params: ResultadoListParams): Promise<Paginated<ResultadoDto>> {
  return apiGet<Paginated<ResultadoDto>>(ROUTES.list, { params: toQuery(params) });
}

export function getResultado(id: string): Promise<ResultadoDto> {
  return apiGet<ResultadoDto>(ROUTES.detail(id));
}

export function createResultado(payload: Partial<ResultadoDto>): Promise<ResultadoDto> {
  return apiPost<ResultadoDto>(ROUTES.list, payload);
}

export function updateResultado(id: string, payload: Partial<ResultadoDto>): Promise<ResultadoDto> {
  return apiPut<ResultadoDto>(ROUTES.detail(id), payload);
}

export function deleteResultado(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(id));
}
