import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type { DistribuicaoDto, DistribuicaoListParams } from "@/types/dto/distribuicao";

/**
 * Serviço de dados do módulo Distribuição. Segue o padrão de `departamentos.ts`.
 *
 * NOTA de integração: rotas ainda não presentes em `endpoints.ts` (editado em
 * paralelo). Definidas localmente para manter o `tsc` limpo — ver reporte final.
 */
const DISTRIBUICAO_ROUTES = {
  list: "/distribuicao",
  detail: (id: string) => `/distribuicao/${id}`,
} as const;

function toQuery(params: DistribuicaoListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.batchId) query.batch_id = params.batchId;
  return query;
}

export function listDistribuicoes(params: DistribuicaoListParams): Promise<Paginated<DistribuicaoDto>> {
  return apiGet<Paginated<DistribuicaoDto>>(DISTRIBUICAO_ROUTES.list, { params: toQuery(params) });
}

export function createDistribuicao(payload: Partial<DistribuicaoDto>): Promise<DistribuicaoDto> {
  return apiPost<DistribuicaoDto>(DISTRIBUICAO_ROUTES.list, payload);
}

export function updateDistribuicao(id: string, payload: Partial<DistribuicaoDto>): Promise<DistribuicaoDto> {
  return apiPut<DistribuicaoDto>(DISTRIBUICAO_ROUTES.detail(id), payload);
}

export function deleteDistribuicao(id: string): Promise<void> {
  return apiDelete<void>(DISTRIBUICAO_ROUTES.detail(id));
}
