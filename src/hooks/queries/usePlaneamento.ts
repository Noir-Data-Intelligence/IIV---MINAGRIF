import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPlano, deletePlano, listPlanos, updatePlano } from "@/services/api/planeamento";
import type { PlanoDto, PlanoListParams } from "@/types/dto/plano";

/** Hooks react-query do módulo Planeamento. Segue o padrão de `useDepartamentos.ts`. */

export const planoKeys = {
  all: ["planeamento"] as const,
  lists: () => [...planoKeys.all, "list"] as const,
  list: (params: PlanoListParams) => [...planoKeys.lists(), params] as const,
  details: () => [...planoKeys.all, "detail"] as const,
  detail: (id: string) => [...planoKeys.details(), id] as const,
};

export function usePlanosList(params: PlanoListParams) {
  return useQuery({
    queryKey: planoKeys.list(params),
    queryFn: () => listPlanos(params),
  });
}

export function useCreatePlano() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<PlanoDto>) => createPlano(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planoKeys.lists() });
    },
  });
}

export function useUpdatePlano() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PlanoDto> }) => updatePlano(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: planoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planoKeys.detail(updated.id) });
    },
  });
}

export function useDeletePlano() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePlano(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planoKeys.lists() });
    },
  });
}
