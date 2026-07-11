import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProcessType,
  createProcessTypeStep,
  deleteProcessType,
  deleteProcessTypeStep,
  listProcessTypes,
  listProcessTypeSteps,
  reorderProcessTypeSteps,
  updateProcessType,
  updateProcessTypeStep,
} from "@/services/api/processTypes";
import type {
  ProcessTypeDto,
  ProcessTypeListParams,
  ProcessTypeStepDto,
} from "@/types/dto/processType";

/**
 * Hooks react-query do módulo Tipos de Processo.
 *
 * `processTypeKeys` inclui, além de list/detail, uma sub-chave `steps(typeId)`
 * para as etapas-padrão de cada tipo, à semelhança de `animalKeys.events`.
 */
export const processTypeKeys = {
  all: ["processTypes"] as const,
  lists: () => [...processTypeKeys.all, "list"] as const,
  list: (params: ProcessTypeListParams) => [...processTypeKeys.lists(), params] as const,
  details: () => [...processTypeKeys.all, "detail"] as const,
  detail: (id: string) => [...processTypeKeys.details(), id] as const,
  steps: (typeId: string) => [...processTypeKeys.detail(typeId), "etapas"] as const,
};

export function useProcessTypesList(params: ProcessTypeListParams) {
  return useQuery({
    queryKey: processTypeKeys.list(params),
    queryFn: () => listProcessTypes(params),
  });
}

export function useCreateProcessType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ProcessTypeDto>) => createProcessType(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: processTypeKeys.lists() });
    },
  });
}

export function useUpdateProcessType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProcessTypeDto> }) =>
      updateProcessType(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: processTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: processTypeKeys.detail(updated.id) });
    },
  });
}

export function useDeleteProcessType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProcessType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: processTypeKeys.lists() });
    },
  });
}

// ---- Sub-entidade: etapas-padrão ----
export function useProcessTypeSteps(typeId: string | null) {
  return useQuery({
    queryKey: processTypeKeys.steps(typeId ?? "none"),
    queryFn: () => listProcessTypeSteps(typeId as string),
    enabled: !!typeId,
  });
}

export function useCreateProcessTypeStep(typeId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ProcessTypeStepDto>) =>
      createProcessTypeStep(typeId as string, payload),
    onSuccess: () => {
      if (typeId) queryClient.invalidateQueries({ queryKey: processTypeKeys.steps(typeId) });
    },
  });
}

export function useUpdateProcessTypeStep(typeId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, payload }: { stepId: string; payload: Partial<ProcessTypeStepDto> }) =>
      updateProcessTypeStep(typeId as string, stepId, payload),
    onSuccess: () => {
      if (typeId) queryClient.invalidateQueries({ queryKey: processTypeKeys.steps(typeId) });
    },
  });
}

export function useDeleteProcessTypeStep(typeId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => deleteProcessTypeStep(typeId as string, stepId),
    onSuccess: () => {
      if (typeId) queryClient.invalidateQueries({ queryKey: processTypeKeys.steps(typeId) });
    },
  });
}

export function useReorderProcessTypeSteps(typeId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderProcessTypeSteps(typeId as string, orderedIds),
    onSuccess: () => {
      if (typeId) queryClient.invalidateQueries({ queryKey: processTypeKeys.steps(typeId) });
    },
  });
}
