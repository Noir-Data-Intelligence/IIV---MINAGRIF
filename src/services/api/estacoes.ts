import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type { EstacaoDto, EstacaoListParams } from "@/types/dto/estacao";

/**
 * Serviço de dados do módulo Estações.
 *
 * Segue o ficheiro-padrão `departamentos.ts`: assenta nos helpers de `client.ts`
 * e nunca conhece o axios nem o MSW directamente. As rotas ficam declaradas
 * localmente (ROUTES) porque `endpoints.ts` está a ser editado noutro processo.
 */
const ROUTES = {
  list: "/estacoes",
  detail: (id: string) => `/estacoes/${id}`,
};

/** Converte `EstacaoListParams` em query params REST (snake_case p/ Laravel). */
function toQuery(params: EstacaoListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  return query;
}

export function listEstacoes(params: EstacaoListParams): Promise<Paginated<EstacaoDto>> {
  return apiGet<Paginated<EstacaoDto>>(ROUTES.list, { params: toQuery(params) });
}

export function createEstacao(payload: Partial<EstacaoDto>): Promise<EstacaoDto> {
  return apiPost<EstacaoDto>(ROUTES.list, payload);
}

export function updateEstacao(id: string, payload: Partial<EstacaoDto>): Promise<EstacaoDto> {
  return apiPut<EstacaoDto>(ROUTES.detail(id), payload);
}

export function deleteEstacao(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(id));
}
