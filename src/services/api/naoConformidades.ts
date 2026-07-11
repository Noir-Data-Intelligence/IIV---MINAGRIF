import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type { NaoConformidadeDto, NaoConformidadeListParams } from "@/types/dto/naoConformidade";

/**
 * Serviço de dados do módulo Não-Conformidades.
 *
 * Replica o ficheiro-padrão `auditorias.ts`/`departamentos.ts`: assenta nos
 * helpers de `client.ts` e nunca conhece o axios nem o MSW directamente.
 *
 * NOTA: as rotas estão declaradas aqui localmente (`ROUTES`) em vez de virem de
 * `endpoints.ts` porque esse ficheiro central está a ser editado noutro processo
 * em paralelo — a entrada `naoConformidades` deve ser consolidada lá (ver relatório).
 */
const ROUTES = {
  list: "/nao-conformidades",
  detail: (id: string) => `/nao-conformidades/${id}`,
};

/** Converte `NaoConformidadeListParams` em query params REST (snake_case p/ Laravel). */
function toQuery(params: NaoConformidadeListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.severity) query.severity = params.severity;
  if (params.status) query.status = params.status;
  if (params.departmentId) query.department_id = params.departmentId;
  if (params.auditId) query.audit_id = params.auditId;
  return query;
}

export function listNaoConformidades(
  params: NaoConformidadeListParams,
): Promise<Paginated<NaoConformidadeDto>> {
  return apiGet<Paginated<NaoConformidadeDto>>(ROUTES.list, { params: toQuery(params) });
}

export function getNaoConformidade(id: string): Promise<NaoConformidadeDto> {
  return apiGet<NaoConformidadeDto>(ROUTES.detail(id));
}

export function createNaoConformidade(
  payload: Partial<NaoConformidadeDto>,
): Promise<NaoConformidadeDto> {
  return apiPost<NaoConformidadeDto>(ROUTES.list, payload);
}

export function updateNaoConformidade(
  id: string,
  payload: Partial<NaoConformidadeDto>,
): Promise<NaoConformidadeDto> {
  return apiPut<NaoConformidadeDto>(ROUTES.detail(id), payload);
}

export function deleteNaoConformidade(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(id));
}
