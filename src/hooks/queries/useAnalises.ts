import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAnalise,
  deleteAnalise,
  getAnalise,
  listAnalises,
  updateAnalise,
} from "@/services/api/analises";
import type { AnaliseDto, AnaliseListParams } from "@/types/dto/analise";

/**
 * Hooks react-query do módulo Análises (replica o padrão de `useDepartamentos.ts`).
 */
export const analiseKeys = {
  all: ["analises"] as const,
  lists: () => [...analiseKeys.all, "list"] as const,
  list: (params: AnaliseListParams) => [...analiseKeys.lists(), params] as const,
  details: () => [...analiseKeys.all, "detail"] as const,
  detail: (id: string) => [...analiseKeys.details(), id] as const,
};

export function useAnalisesList(params: AnaliseListParams) {
  return useQuery({
    queryKey: analiseKeys.list(params),
    queryFn: () => listAnalises(params),
  });
}

export function useAnalise(id: string | undefined) {
  return useQuery({
    queryKey: analiseKeys.detail(id ?? ""),
    queryFn: () => getAnalise(id as string),
    enabled: !!id,
  });
}

export function useCreateAnalise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AnaliseDto>) => createAnalise(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analiseKeys.lists() });
    },
  });
}

export function useUpdateAnalise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AnaliseDto> }) =>
      updateAnalise(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: analiseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: analiseKeys.detail(updated.id) });
    },
  });
}

export function useDeleteAnalise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAnalise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analiseKeys.lists() });
    },
  });
}
