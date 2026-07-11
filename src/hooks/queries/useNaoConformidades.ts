import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNaoConformidade,
  deleteNaoConformidade,
  listNaoConformidades,
  updateNaoConformidade,
} from "@/services/api/naoConformidades";
import type {
  NaoConformidadeDto,
  NaoConformidadeListParams,
} from "@/types/dto/naoConformidade";

/**
 * Hooks react-query do módulo Não-Conformidades (replica o padrão de
 * `useAuditorias.ts`). Query keys hierárquicas para invalidação selectiva.
 */
export const naoConformidadeKeys = {
  all: ["naoConformidades"] as const,
  lists: () => [...naoConformidadeKeys.all, "list"] as const,
  list: (params: NaoConformidadeListParams) => [...naoConformidadeKeys.lists(), params] as const,
  details: () => [...naoConformidadeKeys.all, "detail"] as const,
  detail: (id: string) => [...naoConformidadeKeys.details(), id] as const,
};

export function useNaoConformidadesList(params: NaoConformidadeListParams) {
  return useQuery({
    queryKey: naoConformidadeKeys.list(params),
    queryFn: () => listNaoConformidades(params),
  });
}

export function useCreateNaoConformidade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<NaoConformidadeDto>) => createNaoConformidade(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: naoConformidadeKeys.lists() });
    },
  });
}

export function useUpdateNaoConformidade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<NaoConformidadeDto> }) =>
      updateNaoConformidade(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: naoConformidadeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: naoConformidadeKeys.detail(updated.id) });
    },
  });
}

export function useDeleteNaoConformidade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNaoConformidade(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: naoConformidadeKeys.lists() });
    },
  });
}
