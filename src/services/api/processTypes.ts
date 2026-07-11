import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  ProcessTypeDto,
  ProcessTypeListParams,
  ProcessTypeStepDto,
} from "@/types/dto/processType";

/**
 * Serviço de dados do módulo Tipos de Processo (+ sub-entidade etapas-padrão).
 *
 * Segue o padrão de `departamentos.ts`/`animais.ts`. Rotas declaradas localmente
 * (ROUTES) porque `endpoints.ts` está a ser editado noutro processo — ver o
 * resumo final para as entradas a acrescentar. As etapas-padrão são um recurso
 * aninhado sob `/processos-tipos/{id}/etapas`.
 */
const ROUTES = {
  list: "/processos-tipos",
  detail: (id: string) => `/processos-tipos/${id}`,
  steps: (typeId: string) => `/processos-tipos/${typeId}/etapas`,
  step: (typeId: string, stepId: string) => `/processos-tipos/${typeId}/etapas/${stepId}`,
  stepsReorder: (typeId: string) => `/processos-tipos/${typeId}/etapas/reordenar`,
};

function toQuery(params: ProcessTypeListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.activeOnly) query.active_only = true;
  return query;
}

export function listProcessTypes(
  params: ProcessTypeListParams,
): Promise<Paginated<ProcessTypeDto>> {
  return apiGet<Paginated<ProcessTypeDto>>(ROUTES.list, { params: toQuery(params) });
}

export function createProcessType(payload: Partial<ProcessTypeDto>): Promise<ProcessTypeDto> {
  return apiPost<ProcessTypeDto>(ROUTES.list, payload);
}

export function updateProcessType(
  id: string,
  payload: Partial<ProcessTypeDto>,
): Promise<ProcessTypeDto> {
  return apiPut<ProcessTypeDto>(ROUTES.detail(id), payload);
}

export function deleteProcessType(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(id));
}

// ---- Sub-entidade: etapas-padrão ----
export function listProcessTypeSteps(typeId: string): Promise<ProcessTypeStepDto[]> {
  return apiGet<ProcessTypeStepDto[]>(ROUTES.steps(typeId));
}

export function createProcessTypeStep(
  typeId: string,
  payload: Partial<ProcessTypeStepDto>,
): Promise<ProcessTypeStepDto> {
  return apiPost<ProcessTypeStepDto>(ROUTES.steps(typeId), payload);
}

export function updateProcessTypeStep(
  typeId: string,
  stepId: string,
  payload: Partial<ProcessTypeStepDto>,
): Promise<ProcessTypeStepDto> {
  return apiPut<ProcessTypeStepDto>(ROUTES.step(typeId, stepId), payload);
}

export function deleteProcessTypeStep(typeId: string, stepId: string): Promise<void> {
  return apiDelete<void>(ROUTES.step(typeId, stepId));
}

/** Reordena as etapas de um tipo enviando a lista completa de ids na nova ordem. */
export function reorderProcessTypeSteps(
  typeId: string,
  orderedIds: string[],
): Promise<ProcessTypeStepDto[]> {
  return apiPost<ProcessTypeStepDto[]>(ROUTES.stepsReorder(typeId), { orderedIds });
}
