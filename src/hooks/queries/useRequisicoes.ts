import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRequisicao, getRequisicao, listRequisicoes } from "@/services/api/requisicoes";
import type { RequisicaoListParams, RequisicaoPayload } from "@/types/dto/requisicao";

/** Hooks react-query do módulo Requisições (Onda 3 — Laboratório). */
export const requisicaoKeys = {
  all: ["requisicoes"] as const,
  lists: () => [...requisicaoKeys.all, "list"] as const,
  list: (params: RequisicaoListParams) => [...requisicaoKeys.lists(), params] as const,
  details: () => [...requisicaoKeys.all, "detail"] as const,
  detail: (id: string) => [...requisicaoKeys.details(), id] as const,
};

export function useRequisicoesList(params: RequisicaoListParams) {
  return useQuery({
    queryKey: requisicaoKeys.list(params),
    queryFn: () => listRequisicoes(params),
  });
}

export function useRequisicao(id: string | undefined) {
  return useQuery({
    queryKey: requisicaoKeys.detail(id ?? ""),
    queryFn: () => getRequisicao(id as string),
    enabled: !!id,
  });
}

export function useCreateRequisicao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RequisicaoPayload) => createRequisicao(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisicaoKeys.lists() });
    },
  });
}
