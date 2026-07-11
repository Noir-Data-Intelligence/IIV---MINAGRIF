import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEstacao,
  deleteEstacao,
  listEstacoes,
  updateEstacao,
} from "@/services/api/estacoes";
import type { EstacaoDto, EstacaoListParams } from "@/types/dto/estacao";

/**
 * Hooks react-query do módulo Estações.
 *
 * Replica o padrão de `useDepartamentos.ts`:
 *  - `estacaoKeys`: fábrica de query keys hierárquicas (all -> lists/details);
 *  - query para list; mutations create/update/delete a invalidar as listas.
 */
export const estacaoKeys = {
  all: ["estacoes"] as const,
  lists: () => [...estacaoKeys.all, "list"] as const,
  list: (params: EstacaoListParams) => [...estacaoKeys.lists(), params] as const,
  details: () => [...estacaoKeys.all, "detail"] as const,
  detail: (id: string) => [...estacaoKeys.details(), id] as const,
};

export function useEstacoesList(params: EstacaoListParams) {
  return useQuery({
    queryKey: estacaoKeys.list(params),
    queryFn: () => listEstacoes(params),
  });
}

export function useCreateEstacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EstacaoDto>) => createEstacao(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estacaoKeys.lists() });
    },
  });
}

export function useUpdateEstacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<EstacaoDto> }) =>
      updateEstacao(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: estacaoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: estacaoKeys.detail(updated.id) });
    },
  });
}

export function useDeleteEstacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEstacao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estacaoKeys.lists() });
    },
  });
}
