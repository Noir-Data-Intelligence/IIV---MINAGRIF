import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type { LaboratorioDto, LaboratorioListParams } from "@/types/dto/laboratorio";

/**
 * Serviço de dados do módulo Laboratórios.
 *
 * Replica o ficheiro-padrão `departamentos.ts`/`noticias.ts`: assenta nos helpers
 * de `client.ts` e nunca conhece o axios nem o MSW directamente.
 *
 * NOTA: as rotas estão declaradas aqui localmente (`ROUTES`) em vez de virem de
 * `endpoints.ts` porque esse ficheiro central está a ser editado noutro processo
 * em paralelo — a entrada `laboratorios` deve ser consolidada lá (ver relatório).
 */
const ROUTES = {
  list: "/laboratorios",
  detail: (id: string) => `/laboratorios/${id}`,
};

/** Converte `LaboratorioListParams` em query params REST (snake_case p/ Laravel). */
function toQuery(params: LaboratorioListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  return query;
}

export function listLaboratorios(params: LaboratorioListParams): Promise<Paginated<LaboratorioDto>> {
  return apiGet<Paginated<LaboratorioDto>>(ROUTES.list, { params: toQuery(params) });
}

export function getLaboratorio(id: string): Promise<LaboratorioDto> {
  return apiGet<LaboratorioDto>(ROUTES.detail(id));
}

export function createLaboratorio(payload: Partial<LaboratorioDto>): Promise<LaboratorioDto> {
  return apiPost<LaboratorioDto>(ROUTES.list, payload);
}

export function updateLaboratorio(id: string, payload: Partial<LaboratorioDto>): Promise<LaboratorioDto> {
  return apiPut<LaboratorioDto>(ROUTES.detail(id), payload);
}

export function deleteLaboratorio(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(id));
}
