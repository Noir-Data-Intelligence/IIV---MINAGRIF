import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDepartamento,
  deleteDepartamento,
  listDepartamentos,
  updateDepartamento,
} from "@/services/api/departamentos";
import type { DepartamentoDto, DepartamentoListParams } from "@/types/dto/departamento";

/**
 * Hooks react-query do módulo Departamentos.
 *
 * Replica o padrão de `useNoticias.ts`:
 *  - `departamentoKeys`: fábrica de query keys hierárquicas (all -> lists/details),
 *    para invalidação precisa.
 *  - query para list; mutations para create/update/delete, todas a invalidar as
 *    listas no onSuccess.
 */

export const departamentoKeys = {
  all: ["departamentos"] as const,
  lists: () => [...departamentoKeys.all, "list"] as const,
  list: (params: DepartamentoListParams) => [...departamentoKeys.lists(), params] as const,
  details: () => [...departamentoKeys.all, "detail"] as const,
  detail: (id: string) => [...departamentoKeys.details(), id] as const,
};

export function useDepartamentosList(params: DepartamentoListParams) {
  return useQuery({
    queryKey: departamentoKeys.list(params),
    queryFn: () => listDepartamentos(params),
  });
}

export function useCreateDepartamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<DepartamentoDto>) => createDepartamento(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departamentoKeys.lists() });
    },
  });
}

export function useUpdateDepartamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DepartamentoDto> }) =>
      updateDepartamento(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: departamentoKeys.lists() });
      // Actualiza também o detalhe em cache para leitura imediata.
      queryClient.invalidateQueries({ queryKey: departamentoKeys.detail(updated.id) });
    },
  });
}

export function useDeleteDepartamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDepartamento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departamentoKeys.lists() });
    },
  });
}
