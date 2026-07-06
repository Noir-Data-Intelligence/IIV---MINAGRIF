import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createResultado,
  deleteResultado,
  getResultado,
  listResultados,
  updateResultado,
} from "@/services/api/resultados";
import type { ResultadoDto, ResultadoListParams } from "@/types/dto/resultado";

/**
 * Hooks react-query do módulo Resultados (replica o padrão de `useDepartamentos.ts`).
 */
export const resultadoKeys = {
  all: ["resultados"] as const,
  lists: () => [...resultadoKeys.all, "list"] as const,
  list: (params: ResultadoListParams) => [...resultadoKeys.lists(), params] as const,
  details: () => [...resultadoKeys.all, "detail"] as const,
  detail: (id: string) => [...resultadoKeys.details(), id] as const,
};

export function useResultadosList(params: ResultadoListParams) {
  return useQuery({
    queryKey: resultadoKeys.list(params),
    queryFn: () => listResultados(params),
  });
}

export function useResultado(id: string | undefined) {
  return useQuery({
    queryKey: resultadoKeys.detail(id ?? ""),
    queryFn: () => getResultado(id as string),
    enabled: !!id,
  });
}

export function useCreateResultado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ResultadoDto>) => createResultado(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resultadoKeys.lists() });
    },
  });
}

export function useUpdateResultado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ResultadoDto> }) =>
      updateResultado(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: resultadoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: resultadoKeys.detail(updated.id) });
    },
  });
}

export function useDeleteResultado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteResultado(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resultadoKeys.lists() });
    },
  });
}
