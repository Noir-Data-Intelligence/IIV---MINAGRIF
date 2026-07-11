import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProducao,
  deleteProducao,
  listProducoes,
  updateProducao,
} from "@/services/api/pecuaria";
import type { ProdDto, ProdListParams } from "@/types/dto/pecuaria";

/**
 * Hooks react-query do módulo Produção Pecuária.
 *
 * Replica o padrão de `useEstacoes.ts`: fábrica de query keys hierárquicas
 * (all -> lists/details); query para list; mutations create/update/delete a
 * invalidar as listas.
 */
export const producaoKeys = {
  all: ["producao-pecuaria"] as const,
  lists: () => [...producaoKeys.all, "list"] as const,
  list: (params: ProdListParams) => [...producaoKeys.lists(), params] as const,
  details: () => [...producaoKeys.all, "detail"] as const,
  detail: (id: string) => [...producaoKeys.details(), id] as const,
};

export function useProducaoList(params: ProdListParams) {
  return useQuery({
    queryKey: producaoKeys.list(params),
    queryFn: () => listProducoes(params),
  });
}

export function useCreateProducao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ProdDto>) => createProducao(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: producaoKeys.lists() });
    },
  });
}

export function useUpdateProducao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProdDto> }) =>
      updateProducao(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: producaoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: producaoKeys.detail(updated.id) });
    },
  });
}

export function useDeleteProducao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProducao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: producaoKeys.lists() });
    },
  });
}
