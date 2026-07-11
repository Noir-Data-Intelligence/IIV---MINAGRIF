import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type { AuditoriaDto, AuditoriaListParams } from "@/types/dto/auditoria";

/**
 * Serviço de dados do módulo Auditorias.
 *
 * Replica o ficheiro-padrão `departamentos.ts`/`laboratorios.ts`: assenta nos
 * helpers de `client.ts` e nunca conhece o axios nem o MSW directamente.
 *
 * NOTA: as rotas estão declaradas aqui localmente (`ROUTES`) em vez de virem de
 * `endpoints.ts` porque esse ficheiro central está a ser editado noutro processo
 * em paralelo — a entrada `auditorias` deve ser consolidada lá (ver relatório).
 */
const ROUTES = {
  list: "/auditorias",
  detail: (id: string) => `/auditorias/${id}`,
};

/** Converte `AuditoriaListParams` em query params REST (snake_case p/ Laravel). */
function toQuery(params: AuditoriaListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  return query;
}

export function listAuditorias(params: AuditoriaListParams): Promise<Paginated<AuditoriaDto>> {
  return apiGet<Paginated<AuditoriaDto>>(ROUTES.list, { params: toQuery(params) });
}

export function getAuditoria(id: string): Promise<AuditoriaDto> {
  return apiGet<AuditoriaDto>(ROUTES.detail(id));
}

export function createAuditoria(payload: Partial<AuditoriaDto>): Promise<AuditoriaDto> {
  return apiPost<AuditoriaDto>(ROUTES.list, payload);
}

export function updateAuditoria(id: string, payload: Partial<AuditoriaDto>): Promise<AuditoriaDto> {
  return apiPut<AuditoriaDto>(ROUTES.detail(id), payload);
}

export function deleteAuditoria(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(id));
}
