import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  CreateProcessEventInput,
  CreateProcessInput,
  ProcessDto,
  ProcessEventDto,
  ProcessListParams,
  ProcessStatsDto,
  ProcessStepDto,
  ProcessTransitionInput,
  UpdateProcessStepInput,
} from "@/types/dto/process";
import type {
  CreateProcessAttachmentInput,
  ProcessAttachmentDto,
} from "@/types/dto/processAttachment";

/**
 * Serviço de dados do módulo Processos (+ sub-entidades etapas e eventos).
 *
 * Segue o padrão de `animais.ts`. Rotas declaradas localmente (ROUTES) porque
 * `endpoints.ts` está a ser editado noutro processo — ver o resumo final.
 *
 * NOTA sobre `createProcess`: o servidor (mock MSW / futuro Laravel) instancia
 * as etapas do processo a partir do tipo, activa a primeira e regista o evento
 * "aberto". O cliente só envia `CreateProcessInput` e recebe o `ProcessDto` já
 * criado (com `currentStepId`/`status` preenchidos). É esta a função que o
 * `OpenProcessButton` e o `ProcessoDetalhe` reutilizam.
 */
const ROUTES = {
  list: "/processos",
  detail: (id: string) => `/processos/${id}`,
  stats: "/processos/stats",
  steps: (id: string) => `/processos/${id}/etapas`,
  step: (id: string, stepId: string) => `/processos/${id}/etapas/${stepId}`,
  events: (id: string) => `/processos/${id}/eventos`,
  advance: (id: string) => `/processos/${id}/avancar`,
  return: (id: string) => `/processos/${id}/devolver`,
  cancel: (id: string) => `/processos/${id}/cancelar`,
  attachments: (id: string) => `/processos/${id}/anexos`,
  attachment: (id: string, attachmentId: string) => `/processos/${id}/anexos/${attachmentId}`,
};

function toQuery(params: ProcessListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  if (params.typeId) query.type_id = params.typeId;
  if (params.requesterId) query.requester_id = params.requesterId;
  return query;
}

export function listProcesses(params: ProcessListParams): Promise<Paginated<ProcessDto>> {
  return apiGet<Paginated<ProcessDto>>(ROUTES.list, { params: toQuery(params) });
}

export function getProcess(id: string): Promise<ProcessDto> {
  return apiGet<ProcessDto>(ROUTES.detail(id));
}

export function getProcessStats(): Promise<ProcessStatsDto> {
  return apiGet<ProcessStatsDto>(ROUTES.stats);
}

export function createProcess(input: CreateProcessInput): Promise<ProcessDto> {
  return apiPost<ProcessDto>(ROUTES.list, input);
}

export function updateProcess(id: string, payload: Partial<ProcessDto>): Promise<ProcessDto> {
  return apiPut<ProcessDto>(ROUTES.detail(id), payload);
}

export function deleteProcess(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(id));
}

// ---- Sub-entidade: etapas do processo ----
export function listProcessSteps(id: string): Promise<ProcessStepDto[]> {
  return apiGet<ProcessStepDto[]>(ROUTES.steps(id));
}

/** Actualiza uma etapa (parecer/estado) — usado para edições manuais. */
export function updateProcessStep(
  id: string,
  stepId: string,
  payload: UpdateProcessStepInput,
): Promise<ProcessStepDto> {
  return apiPut<ProcessStepDto>(ROUTES.step(id, stepId), payload);
}

// ---- Transições de workflow (lógica de estado no servidor) ----

/**
 * Conclui a etapa actual e activa a próxima pendente; se não houver mais etapas,
 * fecha o processo (status "concluido"). Devolve o `ProcessDto` já actualizado.
 */
export function advanceProcess(id: string, payload: ProcessTransitionInput): Promise<ProcessDto> {
  return apiPost<ProcessDto>(ROUTES.advance(id), payload);
}

/** Devolve o processo à etapa anterior (marca a actual como "devolvida"). */
export function returnProcess(id: string, payload: ProcessTransitionInput): Promise<ProcessDto> {
  return apiPost<ProcessDto>(ROUTES.return(id), payload);
}

/** Cancela o processo (status "cancelado", regista evento com a justificação). */
export function cancelProcess(id: string, payload: ProcessTransitionInput): Promise<ProcessDto> {
  return apiPost<ProcessDto>(ROUTES.cancel(id), payload);
}

// ---- Sub-entidade: eventos do processo ----
export function listProcessEvents(id: string): Promise<ProcessEventDto[]> {
  return apiGet<ProcessEventDto[]>(ROUTES.events(id));
}

/** Regista um evento avulso no historial (ex: comentário). */
export function createProcessEvent(
  id: string,
  payload: CreateProcessEventInput,
): Promise<ProcessEventDto> {
  return apiPost<ProcessEventDto>(ROUTES.events(id), payload);
}

// ---- Sub-recurso: anexos do processo ----
export function listProcessAttachments(id: string): Promise<ProcessAttachmentDto[]> {
  return apiGet<ProcessAttachmentDto[]>(ROUTES.attachments(id));
}

export function createProcessAttachment(
  id: string,
  payload: CreateProcessAttachmentInput,
): Promise<ProcessAttachmentDto> {
  return apiPost<ProcessAttachmentDto>(ROUTES.attachments(id), payload);
}

export function deleteProcessAttachment(id: string, attachmentId: string): Promise<void> {
  return apiDelete<void>(ROUTES.attachment(id, attachmentId));
}
