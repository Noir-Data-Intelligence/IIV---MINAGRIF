import { useQuery } from "@tanstack/react-query";
import { getLegislacaoBySlug, listLegislacao } from "@/services/api/legislacao";
import type { LegislacaoListParams } from "@/types/dto/legislacao";

/**
 * Hooks react-query do módulo Legislação.
 *
 * Padrão de `hooks/queries/useNoticias.ts`: `legislacaoKeys` fábrica de query
 * keys hierárquicas (all -> lists/details) para invalidação precisa, e um
 * hook por operação de leitura (lista/detalhe).
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

export function useLegislacaoDetail(slug: string | undefined) {
  return useQuery({
    queryKey: legislacaoKeys.detail(slug ?? ""),
    queryFn: () => getLegislacaoBySlug(slug as string),
    enabled: !!slug,
  });
}
