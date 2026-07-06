import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLegislacao,
  deleteLegislacao,
  getLegislacaoBySlug,
  listLegislacao,
  listLegislacaoAdmin,
  updateLegislacao,
} from "@/services/api/legislacao";
import type { LegislacaoAdminListParams, LegislacaoDto, LegislacaoListParams } from "@/types/dto/legislacao";

/**
 * Hooks react-query do módulo Legislação.
 *
 * Padrão de `hooks/queries/useNoticias.ts`: `legislacaoKeys` fábrica de query
 * keys hierárquicas (all -> lists/details) para invalidação precisa, e um
 * hook por operação de leitura (lista/detalhe) e escrita (create/update/delete,
 * usadas apenas pela página admin).
 */

export const legislacaoKeys = {
  all: ["legislacao"] as const,
  lists: () => [...legislacaoKeys.all, "list"] as const,
  list: (params: LegislacaoListParams) => [...legislacaoKeys.lists(), params] as const,
  details: () => [...legislacaoKeys.all, "detail"] as const,
  detail: (slug: string) => [...legislacaoKeys.details(), slug] as const,
};

export function useLegislacaoList(params: LegislacaoListParams = {}) {
  return useQuery({
    queryKey: legislacaoKeys.list(params),
    queryFn: () => listLegislacao(params),
  });
}

/** Lista paginada (admin) — ver nota de decisão em `services/api/legislacao.ts`. */
export function useLegislacaoAdminList(params: LegislacaoAdminListParams) {
  return useQuery({
    queryKey: legislacaoKeys.list(params),
    queryFn: () => listLegislacaoAdmin(params),
  });
}

export function useLegislacaoDetail(slug: string | undefined) {
  return useQuery({
    queryKey: legislacaoKeys.detail(slug ?? ""),
    queryFn: () => getLegislacaoBySlug(slug as string),
    enabled: !!slug,
  });
}

export function useCreateLegislacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<LegislacaoDto>) => createLegislacao(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legislacaoKeys.lists() });
    },
  });
}

export function useUpdateLegislacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, payload }: { slug: string; payload: Partial<LegislacaoDto> }) =>
      updateLegislacao(slug, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: legislacaoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: legislacaoKeys.detail(updated.slug) });
    },
  });
}

export function useDeleteLegislacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => deleteLegislacao(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legislacaoKeys.lists() });
    },
  });
}
