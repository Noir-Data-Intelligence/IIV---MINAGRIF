import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLaboratorio,
  deleteLaboratorio,
  getLaboratorio,
  listLaboratorios,
  updateLaboratorio,
} from "@/services/api/laboratorios";
import type { LaboratorioDto, LaboratorioListParams } from "@/types/dto/laboratorio";

/**
 * Hooks react-query do módulo Laboratórios (replica o padrão de `useDepartamentos.ts`).
 */
export const laboratorioKeys = {
  all: ["laboratorios"] as const,
  lists: () => [...laboratorioKeys.all, "list"] as const,
  list: (params: LaboratorioListParams) => [...laboratorioKeys.lists(), params] as const,
  details: () => [...laboratorioKeys.all, "detail"] as const,
  detail: (id: string) => [...laboratorioKeys.details(), id] as const,
};

export function useLaboratoriosList(params: LaboratorioListParams) {
  return useQuery({
    queryKey: laboratorioKeys.list(params),
    queryFn: () => listLaboratorios(params),
  });
}

export function useLaboratorio(id: string | undefined) {
  return useQuery({
    queryKey: laboratorioKeys.detail(id ?? ""),
    queryFn: () => getLaboratorio(id as string),
    enabled: !!id,
  });
}

export function useCreateLaboratorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<LaboratorioDto>) => createLaboratorio(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: laboratorioKeys.lists() });
    },
  });
}

export function useUpdateLaboratorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<LaboratorioDto> }) =>
      updateLaboratorio(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: laboratorioKeys.lists() });
      queryClient.invalidateQueries({ queryKey: laboratorioKeys.detail(updated.id) });
    },
  });
}

export function useDeleteLaboratorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLaboratorio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: laboratorioKeys.lists() });
    },
  });
}
