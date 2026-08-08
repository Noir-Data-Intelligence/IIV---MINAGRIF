import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comunicarBoletim, getBoletim, listBoletins, registarResultado, validarBoletim } from "@/services/api/boletins";
import { requisicaoKeys } from "@/hooks/queries/useRequisicoes";
import type { BoletimListParams } from "@/types/dto/boletim";

/** Hooks react-query do módulo Boletins — resultado/validação/comunicação (Onda 3). */
export const boletimKeys = {
  all: ["boletins"] as const,
  lists: () => [...boletimKeys.all, "list"] as const,
  list: (params: BoletimListParams) => [...boletimKeys.lists(), params] as const,
  details: () => [...boletimKeys.all, "detail"] as const,
  detail: (id: string) => [...boletimKeys.details(), id] as const,
};

export function useBoletinsList(params: BoletimListParams) {
  return useQuery({
    queryKey: boletimKeys.list(params),
    queryFn: () => listBoletins(params),
  });
}

export function useBoletim(id: string | undefined) {
  return useQuery({
    queryKey: boletimKeys.detail(id ?? ""),
    queryFn: () => getBoletim(id as string),
    enabled: !!id,
  });
}

function invalidateAfterAccao(queryClient: ReturnType<typeof useQueryClient>, boletimId: string, requisicaoId: string) {
  queryClient.invalidateQueries({ queryKey: boletimKeys.lists() });
  queryClient.invalidateQueries({ queryKey: boletimKeys.detail(boletimId) });
  queryClient.invalidateQueries({ queryKey: requisicaoKeys.detail(requisicaoId) });
}

export function useRegistarResultado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resultado }: { id: string; requisicaoId: string; resultado: Record<string, unknown> }) =>
      registarResultado(id, resultado),
    onSuccess: (_data, variables) => invalidateAfterAccao(queryClient, variables.id, variables.requisicaoId),
  });
}

export function useValidarBoletim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; requisicaoId: string }) => validarBoletim(id),
    onSuccess: (_data, variables) => invalidateAfterAccao(queryClient, variables.id, variables.requisicaoId),
  });
}

export function useComunicarBoletim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; requisicaoId: string }) => comunicarBoletim(id),
    onSuccess: (_data, variables) => invalidateAfterAccao(queryClient, variables.id, variables.requisicaoId),
  });
}
