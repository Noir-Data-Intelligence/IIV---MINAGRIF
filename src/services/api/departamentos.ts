import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { Paginated } from "@/types/dto/paginated";
import type { DepartamentoDto, DepartamentoListParams } from "@/types/dto/departamento";

/**
 * Serviço de dados do módulo Departamentos.
 *
 * Replica o ficheiro-padrão `noticias.ts`: assenta nos helpers de `client.ts` e
 * nas rotas de `endpoints.ts`, e nunca conhece o axios nem o MSW directamente.
 * Os componentes/hooks só falam com estas funções.
 */

/** Converte `DepartamentoListParams` em query params REST (snake_case p/ Laravel). */
function toQuery(params: DepartamentoListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  return query;
}

export function listDepartamentos(params: DepartamentoListParams): Promise<Paginated<DepartamentoDto>> {
  return apiGet<Paginated<DepartamentoDto>>(endpoints.departamentos.list, {
    params: toQuery(params),
  });
}

export function createDepartamento(payload: Partial<DepartamentoDto>): Promise<DepartamentoDto> {
  return apiPost<DepartamentoDto>(endpoints.departamentos.list, payload);
}

export function updateDepartamento(id: string, payload: Partial<DepartamentoDto>): Promise<DepartamentoDto> {
  return apiPut<DepartamentoDto>(endpoints.departamentos.detail(id), payload);
}

export function deleteDepartamento(id: string): Promise<void> {
  return apiDelete<void>(endpoints.departamentos.detail(id));
}
