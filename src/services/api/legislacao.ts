import { apiGet } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { ApiError } from "@/lib/http";
import type { LegislacaoDto, LegislacaoListParams } from "@/types/dto/legislacao";

/**
 * Serviço de dados do módulo Legislação.
 *
 * Segue o padrão de `services/api/noticias.ts`: assenta nos helpers de
 * `client.ts` e nas rotas de `endpoints.ts`, e nunca conhece o axios nem o MSW
 * directamente. Lista simples sem paginação server-side por agora, já que a
 * página actual (`src/pages/Legislacao.tsx`) carrega tudo de uma vez.
 */

/** Converte `LegislacaoListParams` em query params REST. */
function toQuery(params: LegislacaoListParams): Record<string, string | boolean> {
  const query: Record<string, string | boolean> = {};
  if (params.tipo) query.tipo = params.tipo;
  if (params.search) query.search = params.search;
  if (typeof params.published === "boolean") query.published = params.published;
  return query;
}

export function listLegislacao(params: LegislacaoListParams = {}): Promise<LegislacaoDto[]> {
  return apiGet<LegislacaoDto[]>(endpoints.legislacao.list, {
    params: toQuery(params),
  });
}

/** Devolve `null` (em vez de rejeitar) quando o diploma não existe (404). */
export async function getLegislacaoBySlug(slug: string): Promise<LegislacaoDto | null> {
  try {
    return await apiGet<LegislacaoDto>(endpoints.legislacao.detail(slug));
  } catch (error) {
    if ((error as ApiError).status === 404) return null;
    throw error;
  }
}
