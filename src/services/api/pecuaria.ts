import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type { ProdDto, ProdListParams } from "@/types/dto/pecuaria";

/**
 * Serviço de dados do módulo Produção Pecuária.
 *
 * Segue o ficheiro-padrão `estacoes.ts`: assenta nos helpers de `client.ts` e
 * nunca conhece o axios nem o MSW directamente. As rotas ficam declaradas
 * localmente (ROUTES) porque `endpoints.ts` está a ser editado noutro processo —
 * consolidar a entrada `producaoPecuaria` no final.
 */
const ROUTES = {
  list: "/producao-pecuaria",
  detail: (id: string) => `/producao-pecuaria/${id}`,
};

function toQuery(params: ProdListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.stationId) query.station_id = params.stationId;
  if (params.productType) query.product_type = params.productType;
  return query;
}

export function listProducoes(params: ProdListParams): Promise<Paginated<ProdDto>> {
  return apiGet<Paginated<ProdDto>>(ROUTES.list, { params: toQuery(params) });
}

export function createProducao(payload: Partial<ProdDto>): Promise<ProdDto> {
  return apiPost<ProdDto>(ROUTES.list, payload);
}

export function updateProducao(id: string, payload: Partial<ProdDto>): Promise<ProdDto> {
  return apiPut<ProdDto>(ROUTES.detail(id), payload);
}

export function deleteProducao(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(id));
}
