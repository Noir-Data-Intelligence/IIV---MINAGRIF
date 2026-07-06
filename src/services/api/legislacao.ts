import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { ApiError } from "@/lib/http";
import type { Paginated } from "@/types/dto/paginated";
import type { LegislacaoAdminListParams, LegislacaoDto, LegislacaoListParams } from "@/types/dto/legislacao";

/**
 * Serviço de dados do módulo Legislação.
 *
 * Segue o padrão de `services/api/noticias.ts`: assenta nos helpers de
 * `client.ts` e nas rotas de `endpoints.ts`, e nunca conhece o axios nem o MSW
 * directamente. `listLegislacao` mantém-se uma lista simples sem paginação
 * server-side, já que as páginas públicas (`src/pages/Legislacao.tsx` e
 * `LegislacaoDetalhe.tsx`) carregam tudo de uma vez e dependem deste formato.
 *
 * DECISÃO (Fase 2 — CRUD admin): em vez de mudar o tipo de retorno de
 * `listLegislacao` (o que obrigaria a adaptar as páginas públicas já
 * migradas e arriscaria parti-las), foi criada uma função SEPARADA,
 * `listLegislacaoAdmin`, que envia `page`/`per_page` e espera o envelope
 * `Paginated<LegislacaoDto>`. O handler MSW (`mocks/handlers/legislacao.ts`)
 * serve os dois formatos a partir do MESMO endpoint GET /api/legislacao,
 * decidindo pela presença (ou não) de `page`/`per_page` nos query params —
 * quando ausentes (como faz `listLegislacao`), devolve o array simples de
 * sempre; quando presentes (como faz `listLegislacaoAdmin`), devolve o
 * envelope paginado. Isto reflecte fielmente como uma API REST real
 * costuma evoluir de forma retrocompatível.
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

/**
 * Lista PAGINADA de legislação, para uso exclusivo do admin (`<DataTable>`).
 * Ver nota de decisão acima sobre a razão de existir em separado de
 * `listLegislacao`.
 */
export function listLegislacaoAdmin(
  params: LegislacaoAdminListParams,
): Promise<Paginated<LegislacaoDto>> {
  return apiGet<Paginated<LegislacaoDto>>(endpoints.legislacao.list, {
    params: {
      ...toQuery(params),
      page: params.page ?? 1,
      per_page: params.perPage ?? 20,
    },
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

export function createLegislacao(payload: Partial<LegislacaoDto>): Promise<LegislacaoDto> {
  return apiPost<LegislacaoDto>(endpoints.legislacao.list, payload);
}

/** `slug` identifica o recurso (mesmo param usado por `getLegislacaoBySlug`/`endpoints.legislacao.detail`). */
export function updateLegislacao(slug: string, payload: Partial<LegislacaoDto>): Promise<LegislacaoDto> {
  return apiPut<LegislacaoDto>(endpoints.legislacao.detail(slug), payload);
}

export function deleteLegislacao(slug: string): Promise<void> {
  return apiDelete<void>(endpoints.legislacao.detail(slug));
}
