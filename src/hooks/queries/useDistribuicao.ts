import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDistribuicao,
  deleteDistribuicao,
  listDistribuicoes,
  updateDistribuicao,
} from "@/services/api/distribuicao";
import type { DistribuicaoDto, DistribuicaoListParams } from "@/types/dto/distribuicao";

/** Hooks react-query do módulo Distribuição. Segue o padrão de `useDepartamentos.ts`. */

export const distribuicaoKeys = {
  all: ["distribuicao"] as const,
  lists: () => [...distribuicaoKeys.all, "list"] as const,
  list: (params: DistribuicaoListParams) => [...distribuicaoKeys.lists(), params] as const,
  details: () => [...distribuicaoKeys.all, "detail"] as const,
  detail: (id: string) => [...distribuicaoKeys.details(), id] as const,
};

export function useDistribuicaoList(params: DistribuicaoListParams) {
  return useQuery({
    queryKey: distribuicaoKeys.list(params),
    queryFn: () => listDistribuicoes(params),
  });
}

export function useCreateDistribuicao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<DistribuicaoDto>) => createDistribuicao(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: distribuicaoKeys.lists() });
    },
  });
}

export function useUpdateDistribuicao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DistribuicaoDto> }) =>
      updateDistribuicao(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: distribuicaoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: distribuicaoKeys.detail(updated.id) });
    },
  });
}

export function useDeleteDistribuicao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDistribuicao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: distribuicaoKeys.lists() });
    },
  });
}
