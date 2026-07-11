import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAuditoria,
  deleteAuditoria,
  listAuditorias,
  updateAuditoria,
} from "@/services/api/auditorias";
import type { AuditoriaDto, AuditoriaListParams } from "@/types/dto/auditoria";

/**
 * Hooks react-query do módulo Auditorias (replica o padrão de `useDepartamentos.ts`).
 */
export const auditoriaKeys = {
  all: ["auditorias"] as const,
  lists: () => [...auditoriaKeys.all, "list"] as const,
  list: (params: AuditoriaListParams) => [...auditoriaKeys.lists(), params] as const,
  details: () => [...auditoriaKeys.all, "detail"] as const,
  detail: (id: string) => [...auditoriaKeys.details(), id] as const,
};

export function useAuditoriasList(params: AuditoriaListParams) {
  return useQuery({
    queryKey: auditoriaKeys.list(params),
    queryFn: () => listAuditorias(params),
  });
}

export function useCreateAuditoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AuditoriaDto>) => createAuditoria(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditoriaKeys.lists() });
    },
  });
}

export function useUpdateAuditoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AuditoriaDto> }) =>
      updateAuditoria(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: auditoriaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auditoriaKeys.detail(updated.id) });
    },
  });
}

export function useDeleteAuditoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAuditoria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditoriaKeys.lists() });
    },
  });
}
