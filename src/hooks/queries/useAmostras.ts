import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aceitarAmostra, getAmostra, listAmostras, rejeitarAmostra } from "@/services/api/amostras";
import { requisicaoKeys } from "@/hooks/queries/useRequisicoes";
import type { AmostraListParams, RejeitarAmostraPayload } from "@/types/dto/amostra";

/** Hooks react-query do módulo Amostras — triagem (Onda 3 — Laboratório). */
export const amostraKeys = {
  all: ["amostras"] as const,
  lists: () => [...amostraKeys.all, "list"] as const,
  list: (params: AmostraListParams) => [...amostraKeys.lists(), params] as const,
  details: () => [...amostraKeys.all, "detail"] as const,
  detail: (id: string) => [...amostraKeys.details(), id] as const,
};

export function useAmostrasList(params: AmostraListParams) {
  return useQuery({
    queryKey: amostraKeys.list(params),
    queryFn: () => listAmostras(params),
  });
}

export function useAmostra(id: string | undefined) {
  return useQuery({
    queryKey: amostraKeys.detail(id ?? ""),
    queryFn: () => getAmostra(id as string),
    enabled: !!id,
  });
}

/** Invalida também a requisição-mãe (a amostra vem embutida no `amostras[]` do detalhe). */
function invalidateAfterTriagem(queryClient: ReturnType<typeof useQueryClient>, requisicaoId: string) {
  queryClient.invalidateQueries({ queryKey: amostraKeys.lists() });
  queryClient.invalidateQueries({ queryKey: requisicaoKeys.detail(requisicaoId) });
}

export function useAceitarAmostra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; requisicaoId: string }) => aceitarAmostra(id),
    onSuccess: (_data, variables) => invalidateAfterTriagem(queryClient, variables.requisicaoId),
  });
}

export function useRejeitarAmostra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; requisicaoId: string; payload: RejeitarAmostraPayload }) =>
      rejeitarAmostra(id, payload),
    onSuccess: (_data, variables) => invalidateAfterTriagem(queryClient, variables.requisicaoId),
  });
}
