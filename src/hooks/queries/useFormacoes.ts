import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTraining,
  deleteTraining,
  listTrainings,
  updateTraining,
} from "@/services/api/formacoes";
import type { TrainingDto, TrainingListParams } from "@/types/dto/formacoes";

/**
 * Hooks react-query do módulo Formações.
 *
 * Replica o padrão de `useDepartamentos.ts`:
 *  - `trainingKeys`: fábrica de query keys hierárquicas (all -> lists/details),
 *    para invalidação precisa.
 *  - query para list; mutations para create/update/delete, todas a invalidar as
 *    listas no onSuccess.
 */

export const trainingKeys = {
  all: ["formacoes"] as const,
  lists: () => [...trainingKeys.all, "list"] as const,
  list: (params: TrainingListParams) => [...trainingKeys.lists(), params] as const,
  details: () => [...trainingKeys.all, "detail"] as const,
  detail: (id: string) => [...trainingKeys.details(), id] as const,
};

export function useTrainingsList(params: TrainingListParams) {
  return useQuery({
    queryKey: trainingKeys.list(params),
    queryFn: () => listTrainings(params),
  });
}

export function useCreateTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<TrainingDto>) => createTraining(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.lists() });
    },
  });
}

export function useUpdateTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TrainingDto> }) =>
      updateTraining(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trainingKeys.detail(updated.id) });
    },
  });
}

export function useDeleteTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTraining(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.lists() });
    },
  });
}
