import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type { PlanoDto, PlanoListParams } from "@/types/dto/plano";

/**
 * Serviço de dados do módulo Planeamento. Segue o padrão de `departamentos.ts`.
 *
 * NOTA de integração: rotas ainda não presentes em `endpoints.ts` (editado em
 * paralelo). Definidas localmente para manter o `tsc` limpo — ver reporte final.
 */
const PLANEAMENTO_ROUTES = {
  list: "/planeamento",
  detail: (id: string) => `/planeamento/${id}`,
} as const;

function toQuery(params: PlanoListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.productId) query.product_id = params.productId;
  return query;
}

export function listPlanos(params: PlanoListParams): Promise<Paginated<PlanoDto>> {
  return apiGet<Paginated<PlanoDto>>(PLANEAMENTO_ROUTES.list, { params: toQuery(params) });
}

export function createPlano(payload: Partial<PlanoDto>): Promise<PlanoDto> {
  return apiPost<PlanoDto>(PLANEAMENTO_ROUTES.list, payload);
}

export function updatePlano(id: string, payload: Partial<PlanoDto>): Promise<PlanoDto> {
  return apiPut<PlanoDto>(PLANEAMENTO_ROUTES.detail(id), payload);
}

export function deletePlano(id: string): Promise<void> {
  return apiDelete<void>(PLANEAMENTO_ROUTES.detail(id));
}
