import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  advanceProcess,
  cancelProcess,
  createProcess,
  createProcessAttachment,
  createProcessEvent,
  deleteProcess,
  deleteProcessAttachment,
  getProcess,
  getProcessStats,
  listProcessAttachments,
  listProcessEvents,
  listProcesses,
  listProcessSteps,
  returnProcess,
  updateProcess,
  updateProcessStep,
} from "@/services/api/processes";
import type {
  CreateProcessEventInput,
  CreateProcessInput,
  ProcessDto,
  ProcessListParams,
  ProcessTransitionInput,
  UpdateProcessStepInput,
} from "@/types/dto/process";
import type { CreateProcessAttachmentInput } from "@/types/dto/processAttachment";

/**
 * Hooks react-query do módulo Processos.
 *
 * `processKeys` inclui list/detail, uma chave dedicada de `stats` (KPIs) e
 * sub-chaves `steps(id)`/`events(id)` para as sub-entidades de cada processo,
 * que o `ProcessoDetalhe` (migrado a seguir) vai reutilizar.
 */
export const processKeys = {
  all: ["processes"] as const,
  lists: () => [...processKeys.all, "list"] as const,
  list: (params: ProcessListParams) => [...processKeys.lists(), params] as const,
  details: () => [...processKeys.all, "detail"] as const,
  detail: (id: string) => [...processKeys.details(), id] as const,
  stats: () => [...processKeys.all, "stats"] as const,
  steps: (id: string) => [...processKeys.detail(id), "etapas"] as const,
  events: (id: string) => [...processKeys.detail(id), "eventos"] as const,
  attachments: (id: string) => [...processKeys.detail(id), "anexos"] as const,
};

export function useProcessesList(params: ProcessListParams) {
  return useQuery({
    queryKey: processKeys.list(params),
    queryFn: () => listProcesses(params),
  });
}

export function useProcess(id: string | null) {
  return useQuery({
    queryKey: processKeys.detail(id ?? "none"),
    queryFn: () => getProcess(id as string),
    enabled: !!id,
  });
}

export function useProcessStats() {
  return useQuery({
    queryKey: processKeys.stats(),
    queryFn: () => getProcessStats(),
  });
}

/**
 * Cria um processo (o servidor instancia as etapas a partir do tipo e regista o
 * evento de abertura). Devolve o `ProcessDto` já criado — o consumidor navega
 * para `/admin/processos/{id}` a partir de `created.id`.
 */
export function useCreateProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProcessInput) => createProcess(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: processKeys.lists() });
      queryClient.invalidateQueries({ queryKey: processKeys.stats() });
    },
  });
}

export function useUpdateProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProcessDto> }) =>
      updateProcess(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: processKeys.lists() });
      queryClient.invalidateQueries({ queryKey: processKeys.stats() });
      queryClient.invalidateQueries({ queryKey: processKeys.detail(updated.id) });
    },
  });
}

export function useDeleteProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProcess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: processKeys.lists() });
      queryClient.invalidateQueries({ queryKey: processKeys.stats() });
    },
  });
}

// ---- Sub-entidades: etapas e eventos ----
export function useProcessSteps(id: string | null) {
  return useQuery({
    queryKey: processKeys.steps(id ?? "none"),
    queryFn: () => listProcessSteps(id as string),
    enabled: !!id,
  });
}

export function useProcessEvents(id: string | null) {
  return useQuery({
    queryKey: processKeys.events(id ?? "none"),
    queryFn: () => listProcessEvents(id as string),
    enabled: !!id,
  });
}

/**
 * Invalida tudo o que uma transição de workflow altera: o detalhe do processo,
 * as suas etapas e eventos, além das listas e KPIs globais (o estado/atraso do
 * processo pode ter mudado).
 */
function useWorkflowInvalidator(processId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: processKeys.detail(processId) });
    queryClient.invalidateQueries({ queryKey: processKeys.steps(processId) });
    queryClient.invalidateQueries({ queryKey: processKeys.events(processId) });
    queryClient.invalidateQueries({ queryKey: processKeys.lists() });
    queryClient.invalidateQueries({ queryKey: processKeys.stats() });
  };
}

export function useUpdateProcessStep(processId: string) {
  const invalidate = useWorkflowInvalidator(processId);
  return useMutation({
    mutationFn: ({ stepId, payload }: { stepId: string; payload: UpdateProcessStepInput }) =>
      updateProcessStep(processId, stepId, payload),
    onSuccess: invalidate,
  });
}

export function useAdvanceProcess(processId: string) {
  const invalidate = useWorkflowInvalidator(processId);
  return useMutation({
    mutationFn: (payload: ProcessTransitionInput) => advanceProcess(processId, payload),
    onSuccess: invalidate,
  });
}

export function useReturnProcess(processId: string) {
  const invalidate = useWorkflowInvalidator(processId);
  return useMutation({
    mutationFn: (payload: ProcessTransitionInput) => returnProcess(processId, payload),
    onSuccess: invalidate,
  });
}

export function useCancelProcess(processId: string) {
  const invalidate = useWorkflowInvalidator(processId);
  return useMutation({
    mutationFn: (payload: ProcessTransitionInput) => cancelProcess(processId, payload),
    onSuccess: invalidate,
  });
}

export function useCreateProcessEvent(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProcessEventInput) => createProcessEvent(processId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: processKeys.events(processId) });
    },
  });
}

// ---- Sub-recurso: anexos ----
export function useProcessAttachments(id: string | null) {
  return useQuery({
    queryKey: processKeys.attachments(id ?? "none"),
    queryFn: () => listProcessAttachments(id as string),
    enabled: !!id,
  });
}

export function useCreateProcessAttachment(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProcessAttachmentInput) =>
      createProcessAttachment(processId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: processKeys.attachments(processId) });
    },
  });
}

export function useDeleteProcessAttachment(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => deleteProcessAttachment(processId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: processKeys.attachments(processId) });
    },
  });
}
