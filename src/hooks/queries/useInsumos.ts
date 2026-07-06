import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInsumo,
  deleteInsumo,
  getInsumo,
  listInsumos,
  updateInsumo,
} from "@/services/api/insumos";
import type { InsumoDto, InsumoListParams } from "@/types/dto/insumo";

/**
 * Hooks react-query do módulo Insumos (replica o padrão de `useDepartamentos.ts`).
 */
export const insumoKeys = {
  all: ["insumos"] as const,
  lists: () => [...insumoKeys.all, "list"] as const,
  list: (params: InsumoListParams) => [...insumoKeys.lists(), params] as const,
  details: () => [...insumoKeys.all, "detail"] as const,
  detail: (id: string) => [...insumoKeys.details(), id] as const,
};

export function useInsumosList(params: InsumoListParams) {
  return useQuery({
    queryKey: insumoKeys.list(params),
    queryFn: () => listInsumos(params),
  });
}

export function useInsumo(id: string | undefined) {
  return useQuery({
    queryKey: insumoKeys.detail(id ?? ""),
    queryFn: () => getInsumo(id as string),
    enabled: !!id,
  });
}

export function useCreateInsumo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<InsumoDto>) => createInsumo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insumoKeys.lists() });
    },
  });
}

export function useUpdateInsumo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<InsumoDto> }) =>
      updateInsumo(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: insumoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: insumoKeys.detail(updated.id) });
    },
  });
}

export function useDeleteInsumo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInsumo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insumoKeys.lists() });
    },
  });
}
