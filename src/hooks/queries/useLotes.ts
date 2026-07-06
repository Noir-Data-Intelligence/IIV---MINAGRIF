import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLote, deleteLote, listLotes, updateLote } from "@/services/api/lotes";
import type { LoteDto, LoteListParams } from "@/types/dto/lote";

/** Hooks react-query do módulo Lotes. Segue o padrão de `useDepartamentos.ts`. */

export const loteKeys = {
  all: ["lotes"] as const,
  lists: () => [...loteKeys.all, "list"] as const,
  list: (params: LoteListParams) => [...loteKeys.lists(), params] as const,
  details: () => [...loteKeys.all, "detail"] as const,
  detail: (id: string) => [...loteKeys.details(), id] as const,
};

export function useLotesList(params: LoteListParams) {
  return useQuery({
    queryKey: loteKeys.list(params),
    queryFn: () => listLotes(params),
  });
}

export function useCreateLote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<LoteDto>) => createLote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loteKeys.lists() });
    },
  });
}

export function useUpdateLote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<LoteDto> }) => updateLote(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: loteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: loteKeys.detail(updated.id) });
    },
  });
}

export function useDeleteLote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loteKeys.lists() });
    },
  });
}
